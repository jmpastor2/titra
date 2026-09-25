# Recordatorios de dosis (notificaciones push)

Esta guía activa los avisos de dosis en el servidor. Se hace una sola vez.
No hace falta saber programar. Sigue los pasos en orden.

## Cómo funciona

- La app calcula las próximas tomas de cada pauta y las guarda en la tabla `reminders`.
- Cada 5 minutos, Supabase llama a la función `send-reminders`.
- La función envía un aviso por cada toma que ya toca.
- Si la dosis ya está registrada (±4 horas por defecto), no avisa.
- Si un aviso lleva más de 30 minutos sin poder enviarse, se descarta.
- Si un móvil ya no acepta avisos, su suscripción se borra sola.

## Antes de empezar

Necesitas:

1. Acceso al panel de Supabase del proyecto (https://supabase.com/dashboard).
2. El archivo `supabase/.env.reminders.local` de tu ordenador.
   Contiene cuatro líneas: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y `CRON_SECRET`.
   Es secreto. No lo envíes a nadie. Git ya lo ignora.
3. La referencia de tu proyecto. Es la parte `xxxx` de `https://xxxx.supabase.co`.
   La ves en `VITE_SUPABASE_URL` de `.env.local`, o en Project Settings → General → Project ID.

En esta guía, `TU-REFERENCIA` es esa referencia y `TU_CRON_SECRET` es el valor de `CRON_SECRET`.

## Paso 1 · Crear las tablas (SQL Editor)

1. Abre el proyecto en Supabase.
2. Menú izquierdo → **SQL Editor** → **New query**.
3. Abre `supabase/migrations/20260926000000_reminders.sql` y copia todo su contenido.
4. Pégalo en el editor y pulsa **Run**.
5. Debe decir "Success". Puedes ejecutarlo otra vez sin problema.

Esto crea la tabla `reminders`, las funciones que usa la app y la tarea programada.
También hace que borrar una dosis devuelva su cantidad al envase del inventario
(nunca por encima del total del envase).

## Paso 2 · Guardar dos secretos en Vault (SQL Editor)

1. **SQL Editor** → **New query**.
2. Pega estas dos líneas. Cambia `TU-REFERENCIA` y `TU_CRON_SECRET`:

   ```sql
   select vault.create_secret('https://TU-REFERENCIA.supabase.co/functions/v1', 'titra_functions_url');
   select vault.create_secret('TU_CRON_SECRET', 'titra_cron_secret');
   ```

3. Pulsa **Run**.
4. Comprueba que existen (no muestra los valores):

   ```sql
   select name, created_at from vault.secrets where name like 'titra_%';
   ```

   Deben salir dos filas.

Si te equivocas, no uses `create_secret` otra vez. Corrige así:

```sql
select vault.update_secret((select id from vault.secrets where name = 'titra_cron_secret'), 'VALOR_CORRECTO');
```

## Paso 3 · Subir la función `send-reminders`

Elige una opción.

### Opción A · Con la terminal (recomendada)

1. Abre una terminal en la carpeta `C:\ClaudeCode\titra`.
2. Inicia sesión (se abre el navegador):

   ```
   npx supabase login
   ```

3. Sube la función sin verificación JWT:

   ```
   npx supabase functions deploy send-reminders --no-verify-jwt --project-ref TU-REFERENCIA
   ```

4. Si pide Docker, repite el comando añadiendo `--use-api` al final.

### Opción B · Desde el panel

1. Menú izquierdo → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nombre: `send-reminders` (exactamente así).
3. Borra el código de ejemplo de `index.ts`.
   Pega el contenido de `supabase/functions/send-reminders/index.ts`.
4. Añade un archivo nuevo llamado `plan.ts`.
   Pega el contenido de `supabase/functions/send-reminders/plan.ts`.
5. Pulsa **Deploy function**.

## Paso 4 · Poner los secretos de la función

La función necesita las cuatro líneas del archivo `supabase/.env.reminders.local`.

### Opción A · Con la terminal

```
npx supabase secrets set --env-file supabase/.env.reminders.local --project-ref TU-REFERENCIA
```

### Opción B · Desde el panel

1. Menú izquierdo → **Edge Functions** → **Secrets**.
2. Añade cuatro secretos. Copia nombre y valor de cada línea del archivo:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
   - `CRON_SECRET`
3. Pulsa **Save**.

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya los pone Supabase. No los añadas.

## Paso 5 · Desactivar la verificación JWT

La tarea programada entra con `CRON_SECRET`, no con un usuario. Por eso la función no debe pedir JWT.

1. **Edge Functions** → `send-reminders` → **Details** (o **Settings**).
2. Busca **Enforce JWT Verification** (o **Verify JWT with legacy secret**).
3. Déjalo **desactivado** y guarda.

Con la opción A del paso 3 ya queda desactivado. Compruébalo igualmente.

## Paso 6 · Probar

Usa Git Bash, o `curl.exe` en PowerShell (en PowerShell, `curl` a secas es otro comando).

1. Prueba en seco. No envía nada ni cambia nada:

   ```
   curl.exe -i -X POST "https://TU-REFERENCIA.supabase.co/functions/v1/send-reminders?dry=1" -H "x-cron-secret: TU_CRON_SECRET"
   ```

   Debe responder `200` con algo así:

   ```json
   {
     "dry": true,
     "due": 0,
     "sent": 0,
     "skipped": 0,
     "failed": 0,
     "retrying": 0,
     "prunedSubscriptions": 0,
     "stale": 0
   }
   ```

   Si hay avisos pendientes, verás también `wouldSend` y `wouldSkip`.

2. Prueba sin el secreto. Debe responder `401`:

   ```
   curl.exe -i -X POST "https://TU-REFERENCIA.supabase.co/functions/v1/send-reminders"
   ```

   Si el mensaje habla de "JWT" o "authorization header", repite el paso 5.

3. Envío real (lo mismo que hace la tarea cada 5 minutos):

   ```
   curl.exe -i -X POST "https://TU-REFERENCIA.supabase.co/functions/v1/send-reminders" -H "x-cron-secret: TU_CRON_SECRET"
   ```

Qué significa cada número:

| Campo                 | Significado                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `due`                 | Avisos que tocaban ahora.                                              |
| `sent`                | Avisos entregados al menos a un dispositivo.                           |
| `skipped`             | Descartados: dosis ya registrada, sin dispositivos o todos rechazaron. |
| `failed`              | Envíos fallidos a un dispositivo (sin contar suscripciones caducadas). |
| `retrying`            | Avisos que se reintentan en la siguiente vuelta.                       |
| `prunedSubscriptions` | Suscripciones caducadas que se han borrado.                            |
| `stale`               | Avisos antiguos (más de 30 min) descartados sin enviar.                |

## Paso 7 · Comprobar la tarea programada

En **SQL Editor**:

```sql
-- ¿Existe la tarea?
select jobid, jobname, schedule, active from cron.job where jobname = 'titra-send-reminders';

-- Últimas ejecuciones
select status, return_message, start_time
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'titra-send-reminders')
order by start_time desc limit 5;

-- Últimas respuestas de la función
select status_code, left(content::text, 200) as respuesta, created
from net._http_response order by created desc limit 5;
```

`status_code` debe ser `200`. Un `401` indica que `titra_cron_secret` (Vault) y `CRON_SECRET`
(secretos de la función) no coinciden.

Los resúmenes de cada ejecución también salen en **Edge Functions** → `send-reminders` → **Logs**.

## Paso 8 · La app publicada

La app necesita la clave pública `VITE_VAPID_PUBLIC_KEY`. Ya está en `.env.local` para desarrollo.

Para la versión de GitHub Pages:

1. GitHub → repositorio → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**: nombre `VITE_VAPID_PUBLIC_KEY`, valor el de `VAPID_PUBLIC_KEY`.
3. El paso **Build** de `.github/workflows/deploy.yml` debe pasar esa variable
   (igual que `VITE_SUPABASE_URL`). Pídeselo a quien mantenga el código.

## Mantenimiento

- **No cambies las claves VAPID.** Si las cambias, todos los móviles dejan de recibir avisos
  hasta que cada usuario vuelva a activar los recordatorios.
- **Pausar los avisos:**

  ```sql
  select cron.unschedule('titra-send-reminders');
  ```

  Para volver a activarlos, ejecuta otra vez el archivo del paso 1.

- **Cambiar `CRON_SECRET`:** cámbialo en los secretos de la función (paso 4) y en Vault
  (`vault.update_secret`, paso 2). Los dos deben ser iguales.
