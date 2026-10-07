from app import app
from webapp.modules.calculation.repository import SYSTEM_OUTPUT_NAMES, read_output_amounts


INPUT_NAMES = ("JB", "MXX", "YLSN", "L/DX")


def read_amount(input_name: str) -> float:
    while True:
        raw_value = input(f"请输入{input_name}进料量：").strip()
        try:
            amount = float(raw_value)
        except ValueError:
            print("请输入数字。")
            continue

        if amount < 0:
            print("进料量不能小于0。")
            continue

        return amount


def main() -> None:
    payload = {
        "inputs": {
            input_name: read_amount(input_name)
            for input_name in INPUT_NAMES
        }
    }

    client = app.test_client()
    response = client.post("/api/calculation/run", json=payload)
    result = response.get_json()

    print()
    print("POST /api/calculation/run")
    print("status:", response.status_code)
    print("message:", result.get("message") if result else None)

    if response.status_code != 200:
        print("response:", result)
        raise SystemExit("系统运算失败")

    with app.app_context():
        outputs = read_output_amounts(SYSTEM_OUTPUT_NAMES)

    print()
    print("output表结果：")
    for output in outputs:
        print(f"{output['outputName']}: {float(output['outputAmount']):.3f}")


if __name__ == "__main__":
    main()
