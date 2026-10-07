from __future__ import annotations

import unittest
from pathlib import Path
from unittest.mock import patch


class MaterialParameterValidationTests(unittest.TestCase):
    def test_forward_parameters_require_all_supported_materials(self) -> None:
        from webapp.modules.material_calculation import service

        with self.assertRaisesRegex(ValueError, "JB、MXX、L/DX、YLSN"):
            service.normalize_parameter_payload(
                {
                    "mode": "input-to-output",
                    "route": "MXX",
                    "inputs": {"jb": 1, "mxx": 2, "ldx": 3},
                }
            )

    def test_parameter_values_must_be_finite_and_non_negative(self) -> None:
        from webapp.modules.material_calculation import service

        for invalid_value in (-1, float("inf"), float("nan")):
            with self.subTest(value=invalid_value):
                with self.assertRaises(ValueError):
                    service.normalize_parameter_payload(
                        {
                            "mode": "output-to-input",
                            "route": "LDX",
                            "target": {
                                "productName": "硬质糖果成品",
                                "amount": invalid_value,
                            },
                        }
                    )

    def test_mode_and_route_are_allowlisted(self) -> None:
        from webapp.modules.material_calculation import service

        with self.assertRaises(ValueError):
            service.normalize_parameter_payload(
                {"mode": "unknown", "route": "MXX", "inputs": {}}
            )
        with self.assertRaises(ValueError):
            service.normalize_parameter_payload(
                {
                    "mode": "output-to-input",
                    "route": "unknown",
                    "target": {"productName": "硬质糖果成品", "amount": 1},
                }
            )


class MaterialTemplateValidationTests(unittest.TestCase):
    def test_template_name_and_description_limits_are_enforced(self) -> None:
        from webapp.modules.material_calculation import service

        valid = {
            "name": "模板A",
            "description": "常用参数",
            "mode": "input-to-output",
            "route": "MXX",
            "inputs": {"jb": 1, "mxx": 2, "ldx": 3, "ylsn": 4},
        }
        normalized = service.normalize_template_payload(valid)
        self.assertEqual(normalized["name"], "模板A")

        with self.assertRaises(ValueError):
            service.normalize_template_payload({**valid, "name": ""})
        with self.assertRaises(ValueError):
            service.normalize_template_payload({**valid, "name": "A" * 129})
        with self.assertRaises(ValueError):
            service.normalize_template_payload({**valid, "description": "A" * 501})

    @patch("webapp.modules.material_calculation.service.repository.template_name_exists", return_value=False)
    @patch("webapp.modules.material_calculation.service.repository.get_template", return_value={"id": 8})
    @patch("webapp.modules.material_calculation.service.repository.update_template")
    def test_template_update_uses_optimistic_version(
        self, update_template, _get_template, _name_exists
    ) -> None:
        from webapp.modules.material_calculation import service

        update_template.return_value = None
        payload = {
            "name": "模板A",
            "description": "",
            "mode": "output-to-input",
            "route": "MXX",
            "target": {"productName": "硬质糖果成品", "amount": 100},
            "version": 3,
        }

        with self.assertRaises(service.MaterialConflictError):
            service.update_template_payload(8, payload)
        update_template.assert_called_once()
        self.assertEqual(update_template.call_args.args[2], 3)


class MaterialCalculationMigrationTests(unittest.TestCase):
    def test_migration_targets_the_configured_tg_schema(self) -> None:
        migration = (
            Path(__file__).parent
            / "migrations"
            / "20260825_add_material_parameter_templates.sql"
        ).read_text(encoding="utf-8")

        self.assertIn("FROM ALL_TABLES", migration)
        self.assertIn("OWNER = 'TG'", migration)
        self.assertIn('CREATE TABLE "TG"."material_calculation_context"', migration)
        self.assertIn('CREATE TABLE "TG"."material_parameter_template"', migration)
        self.assertIn('CREATE TABLE "TG"."material_parameter_template_item"', migration)


if __name__ == "__main__":
    unittest.main()
