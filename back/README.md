# TG 后端

Flask API 使用 MySQL 8。数据库连接参数通过 `MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_DATABASE`、`MYSQL_USER` 和 `MYSQL_PASSWORD` 配置。本机启动时在 `back/.env` 中填写本机 MySQL 参数，完整步骤见仓库根目录的 `README.md`。

新建空库时，以具备建库建表权限的 MySQL 用户执行 `schema.sql`：

```sh
mysql -u root -p < schema.sql
```

Windows PowerShell 请在 MySQL 客户端中执行 `SOURCE D:/TG/back/schema.sql`，并将路径改为项目实际所在路径。本机初始化和启动的完整步骤见仓库根目录的 `README.md`。

再安装 Python 依赖并启动开发服务：

```sh
pip install -r requirements.txt
python check_db.py
```

Windows 本地开发可使用 `start.ps1`，也可在项目根目录双击 `start_all.bat` 同时启动前后端。

## 空库业务数据

主优化接口从客户端提交的投料及仓库内模型参数计算结果，并写入 `input` 与 `output` 表。`assay`、`ratio` 表初始为空；使用旧的逐段收率计算接口前，需录入由业务方确认的设备收率和配比。
