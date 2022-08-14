# Violet
Bot de Telegram para facilitar el manejo de archivos del lado del servidor (indev)
Y ademas como bono un cliente que descarga archivos de canales restringidos hacia mega

## Cliente
```bash
node cliente [--params...]
```
### Datos
Deben especificarse estos 3 primeros parametros para descargar los archivos desde la idstart hasta la idend en el canal o grupo restringido "channel". Estos datos se obtienen de un link:
https://t.me/channel/24

El out es la ruta de cache de los archivos, si usas heroku puede ser "/tmp/" y esta ultima debe terminar en '/'
```
--channel
--idstart
--idend

--out
```

## Environment Variables
Para el bot:
```
BOT_TOKEN="5404716010:AAHA4tjHtsiss3EDtcgYDUP5fAX-abjFfpE"
```

Para el cliente:
```
API_ID=123456
API_HASH="hash"
API_TOKEN=""

MEGA_EMAIL="hola@example.com"
MEGA_PASSWORD="*********"
```

<blockquote>
Las API_ID y API_HASH se pueden obtener en <https://my.telegram.org> y el token se obtiene al iniciar sesion la primera vez y se guarda para no tener que hacerlo las veces posteriores
</blockqoute>