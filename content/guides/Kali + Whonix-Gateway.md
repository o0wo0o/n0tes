---
title: Kali + Whonix-Gateway (VirtualBox)
date: 2025-07-01
---
## Установка всякого

В этом гайде будет рассказано про настройку kali + Whonix-Gateway. Не столько для безопасности, сколько для обхода блокировок (все-таки virtualbox никогда гарантом безопасности не был) да и просто прикольно это 🤡

Ну, давайте начнем.

сначала скачайте ВМки с официальных сайтов (Так и быть, дам ссылки):

[Kali: Сами выберете virtualbox и удобный вариант загрузки](https://www.kali.org/get-kali/#kali-virtual-machines)

[Whonix: лучше выбирайте gui](https://www.whonix.org/wiki/VirtualBox#GUI)


<div class="note-block">

! Кстати, если вы тоже из заблокированных и ограниченных в сети интернет, то можете попробовать перейти по прямым ссылкам (у меня работает):

[kali torrent](https://cdimage.kali.org/kali-2025.2/kali-linux-2025.2-virtualbox-amd64.7z.torrent)  
[download kali](https://cdimage.kali.org/kali-2025.2/kali-linux-2025.2-virtualbox-amd64.7z)  
[download whonix](https://www.whonix.org/download/ova/17.3.9.9/Whonix-Xfce-17.3.9.9.Intel_AMD64.ova)

</div>

## Настройка

Вот мы все и загрузили, пришло время открыть ~~virtualbox~~ проводник и кликнуть сначала по одному, потом по другому файлу. Всё происходит само. Только в whonix не забудьте выбрать путь установки.
![[whonixinst.png]]

Ждем установку, после чего тыкаем в меню на kali, потом на _"настроить"_ (шестеренка ⚙️)
В открывшемся меню выбираем вкладку _"сеть"_ и выбираем

Тип подключения: Внутренняя сеть (Internal network)

Имя: Whonix

![[kalinetwork.png]]

И жмем _ok_


Заходим в новую машинку kali и запускаем bash script:

```bash
#!/bin/bash

# Отключаем интерфейс eth0
ifdown eth0

# Заменяем содержимое /etc/resolv.conf
echo "nameserver 10.152.152.10" > /etc/resolv.conf

# Конфигурация для интерфейса eth0
CONFIG=$(cat <<EOF

# Static configuration for eth0
iface eth0 inet static
    address 10.152.152.11
    netmask 255.255.192.0
    gateway 10.152.152.10
EOF
)

# Добавляем конфигурацию в конец /etc/network/interfaces
echo "$CONFIG" >> /etc/network/interfaces

# Включаем интерфейс eth0
ifup eth0

```



- vim script.bash
- Shift+ctrl+v наш скрипт (копируем)
- sudo bash script.bash

Ну, вот и все При следующих запусках kali для подключения может понадобится запустить _ifup eth0_

## Бонус (Настраиваем tor bridge для whonix)

Запускаем Whonix-Gateway, находим _Anon Connection Wizard_

![[whonixscreen1.png]]

В открывшимся меню выбираем Configure и дальше выбираем Provide a bridge i know 

![[whonixscreen2.png]]

переходим на сайт torproject и [берем мосты](https://bridges.torproject.org/bridges?transport=obfs4)

после чего копируем их и вставляем в окно Connection wizard. И дальше просто жмете next, пока не найдете загрузку.
Ждете её окончания ииии....... Если ждете очень долго и загрузка останавливается где-то до 20%, то дело скорее всего в мосте (Не верьте мне, посмотрите логи, нажав на замочек справа в _tor control panel_). Пробуйте брать новые мосты, пока не найдете рабочий (Искать иногда приходиться долго, но я верю в вас 😉)


![[end.jpg]]