from __future__ import annotations

import unittest

from webapp.modules import optimization_runner
from webapp.modules.reports import service as report_service
from webapp.modules.schedule import service as schedule_service


class ScheduleReportFieldTests(unittest.TestCase):
    def test_selected_fields_are_validated_and_deduplicated(self) -> None:
        fields = report_service._normalize_selected_fields(["product", "jb", "product", ""])

        self.assertEqual([field["key"] for field in fields], ["product", "jb"])

    def test_unknown_or_empty_fields_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            report_service._normalize_selected_fields(["unknown"])
        with self.assertRaises(ValueError):
            report_service._normalize_selected_fields([])


class ConstraintRuleTests(unittest.TestCase):
    def test_constraint_rules_normalize_aliases_and_values(self) -> None:
        rules = schedule_service._normalize_constraint_rules(
            [{"field": "jb", "operator": ">=", "value": "12.5"}]
        )

        self.assertEqual(rules, [{"field": "jb", "operator": "min", "value": 12.5}])

    def test_constraint_rules_enforce_limits_and_allowlist(self) -> None:
        with self.assertRaises(ValueError):
            schedule_service._normalize_constraint_rules([])
        with self.assertRaises(ValueError):
            schedule_service._normalize_constraint_rules(
                [{"field": "unknown", "operator": "min", "value": 1}]
            )
        with self.assertRaises(ValueError):
            schedule_service._normalize_constraint_rules(
                [{"field": "jb", "operator": "min", "value": 1}] * 21
            )

    def test_comparison_uses_totals_for_product_and_averages_for_materials(self) -> None:
        baseline = {"dailyResults": [{"product": 80, "jb": 10}, {"product": 90, "jb": 20}]}
        trial = {"dailyResults": [{"product": 85, "jb": 12}, {"product": 95, "jb": 22}]}

        rows = schedule_service._build_constraint_comparison(baseline, trial)
        by_field = {row["field"]: row for row in rows}

        self.assertEqual(by_field["product"]["before"], 170)
        self.assertEqual(by_field["product"]["after"], 180)
        self.assertEqual(by_field["jb"]["before"], 15)
        self.assertEqual(by_field["jb"]["after"], 17)

    def test_target_tolerance_allows_accumulated_daily_rounding_error(self) -> None:
        self.assertTrue(schedule_service._target_is_satisfied(2499.998, 2500))

    def test_route_specific_rules_are_validated_before_solving(self) -> None:
        with self.assertRaises(ValueError):
            schedule_service._validate_constraint_rules_for_route(
                [{"field": "ldx", "operator": "min", "value": 1}],
                "MXX",
            )
        with self.assertRaises(ValueError):
            schedule_service._validate_constraint_rules_for_route(
                [{"field": "mxx", "operator": "min", "value": 1}],
                "LDX",
            )


class ScheduleResultValidationTests(unittest.TestCase):
    def _make_valid_schedule(self) -> dict:
        daily_result = {
            "date": "2026-08-26",
            "dayIndex": 1,
            "dayName": "周三",
            "jb": 10.0,
            "mxx": 20.0,
            "ldx": 0.0,
            "dnx": 12.0,
            "sa": 40.0,
            "fsa": 10.0,
            "ylsn": 18.0,
            "nx": 15.0,
            "mxxflc": 40.0,
            "x2_2d": 59.4,
            "cztg": 50.0,
            "txxhcc": 49.25,
            "yttg": 70.069,
            "product": 100.683,
            "tg": 100.683,
        }
        return {
            "plan": {
                "id": 1,
                "planName": "validation-demo",
                "startDate": "2026-08-26",
                "endDate": "2026-08-26",
                "planningDays": 1,
                "targetAmount": 100.683,
                "route": "MXX",
            },
            "dailyResults": [daily_result],
        }

    def test_compliant_schedule_returns_success_message(self) -> None:
        result = schedule_service.validate_schedule_result_payload(self._make_valid_schedule())

        self.assertTrue(result["compliant"])
        self.assertEqual(result["summaryMessage"], "调度方案合规")
        self.assertTrue(result["rows"])
        self.assertTrue(all(row["status"] == "pass" for row in result["rows"]))

    def test_daily_bounds_and_total_plan_violations_are_reported(self) -> None:
        schedule = self._make_valid_schedule()
        schedule["dailyResults"][0]["product"] = 111.0
        schedule["dailyResults"][0]["tg"] = 111.0

        result = schedule_service.validate_schedule_result_payload(schedule)

        self.assertFalse(result["compliant"])
        messages = [row["message"] for row in result["rows"] if row["status"] == "fail"]
        self.assertTrue(any("日产量上限" in message for message in messages))
        self.assertTrue(any("计划总产量" in message for message in messages))

    def test_process_equation_violation_reports_clear_context(self) -> None:
        schedule = self._make_valid_schedule()
        schedule["dailyResults"][0]["x2_2d"] = 80.0

        result = schedule_service.validate_schedule_result_payload(schedule)

        self.assertFalse(result["compliant"])
        failed_rows = [row for row in result["rows"] if row["status"] == "fail"]
        self.assertTrue(any(row["constraintKey"] == "s2_in_balance" for row in failed_rows))
        self.assertTrue(any("二段入口平衡" in row["message"] for row in failed_rows))


class ConstraintInjectionTests(unittest.TestCase):
    class _Constraint:
        def __init__(self, index_set, rule):
            self.results = [rule(None, day) for day in index_set]

    class _Pyo:
        Constraint = None

    class _Module:
        pyo = None

    class _Model:
        D = [1, 2]
        JB = {1: 10.0, 2: 12.0}
        external_MXX = {1: 20.0, 2: 21.0}

    def setUp(self) -> None:
        self._Pyo.Constraint = self._Constraint
        self._Module.pyo = self._Pyo

    def test_rules_are_injected_without_persisting_configuration(self) -> None:
        model = self._Model()

        optimization_runner._apply_daily_constraint_rules(
            self._Module,
            model,
            [{"field": "jb", "operator": "min", "value": 10}],
            "MXX",
        )

        self.assertEqual(model.trial_constraint_1.results, [True, True])

    def test_route_specific_fields_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            optimization_runner._apply_daily_constraint_rules(
                self._Module,
                self._Model(),
                [{"field": "mxx", "operator": "min", "value": 1}],
                "LDX",
            )


if __name__ == "__main__":
    unittest.main()
