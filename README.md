# TG（MySQL）多负荷优化系统

前端使用 React + Vite，后端使用 Flask，关系型数据库使用 MySQL 8。优化计算使用 Pyomo 和求解器。仓库不包含数据库文件或密码；首次运行时需要建立空库并初始化表结构。

## Windows 本机首次运行

### 1. 安装软件与依赖

安装并启动 MySQL 8，安装 Python 3.12 和 Node.js/npm。排产等优化功能还需要系统能找到 IPOPT 求解器；部分旧的线性计算功能需要 GLPK 的 `glpsol`。安装求解器后可在命令行运行 `where.exe ipopt` 和 `where.exe glpsol` 检查路径。缺少求解器时页面仍能启动，但相应的优化计算无法完成。以下命令在项目根目录执行：

```powershell
py -3.12 -m venv .venv
& .\.venv\Scripts\python.exe -m pip install -r .\back\requirements.txt
Set-Location .\front
npm ci
Set-Location ..
```

如果已有可用的 `.venv` 和 `front/node_modules`，无需重复安装。`start_all.bat` 要求项目根目录存在 `.venv\Scripts\python.exe`，且 `npm` 能在命令行中运行。

### 2. 创建空库和表

在 MySQL 客户端中以具有建库权限的账号登录，执行 [back/schema.sql](back/schema.sql)。将下面的 `SOURCE` 路径换成项目在你电脑上的实际路径：

```text
mysql --default-character-set=utf8mb4 -u root -p
mysql> SOURCE D:/TG/back/schema.sql
mysql> USE tg;
mysql> SHOW TABLES;
```

脚本会创建名为 `tg` 的数据库和 12 张空表，不需要已有的 TG 数据库备份。若要使用其他库名，应同时修改 `schema.sql` 开头的 `CREATE DATABASE`、`USE` 和下文的 `MYSQL_DATABASE`。`SOURCE` 是 MySQL 客户端命令，不是 PowerShell 命令。

### 3. 在本机填写连接配置

新建或修改 `back/.env`。这个文件已被 Git 忽略，**不要提交真实密码**。以下示例适用于 MySQL 运行在本机 `3306` 端口、数据库名为 `tg`、以 `root` 账号连接的情况：

```ini
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=tg
MYSQL_USER=root
MYSQL_PASSWORD=替换为本机MySQL密码
MYSQL_USER_TABLE=users
FLASK_SECRET_KEY=替换为本机随机密钥
CORS_ORIGIN=http://127.0.0.1:5173
```

使用独立的 MySQL 账号时，填写对应的账号、密码，并授予 `tg` 库所需权限。旧版本 `back/.env` 中的 `DM_*` 配置应删除，当前代码不会用它们连接数据库。

配置完成后，在项目根目录运行：

```powershell
& .\.venv\Scripts\python.exe .\back\check_db.py
```

看到“`MySQL数据库连接成功`”后再启动系统。若只是临时在某个 PowerShell 窗口设置过 `MYSQL_*` 变量，双击批处理文件时不会继承这些变量；需要把本机连接配置写入 `back/.env`。

### 4. 一键启动

保持 MySQL 服务运行，双击项目根目录的 [start_all.bat](start_all.bat)。脚本会打开后端和前端两个窗口；保持窗口运行，浏览器访问 <http://127.0.0.1:5173>。后端健康检查地址为 <http://127.0.0.1:6000/api/health>。关闭两个启动窗口即可停止服务。

也可以在两个 PowerShell 窗口分别运行 `back/start.ps1` 和 `front` 目录下的 `npm run dev`。

## 空库业务数据说明

`back/schema.sql` 只建立表结构，不会自动填入生产收率或比例数据。主优化模型的标定参数保存在 [optimize/hard_candy_calibrated_params.json](optimize/hard_candy_calibrated_params.json)。旧的逐段计算接口依赖 `assay`、`ratio` 等表中的现场业务数据，使用这些接口前须录入经确认的数据。
