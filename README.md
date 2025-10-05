# Gestor de Clientes y Ventas

Esta es una aplicación full-stack construida con Next.js para el seguimiento de clientes, productos y ventas. Incluye un sistema de autenticación con roles de usuario y funcionalidades de administrador para la gestión de usuarios.

## Características

- **Gestión de Clientes (CRUD)**: Crea, lee, actualiza y elimina clientes.
- **Gestión de Productos (CRUD)**: Crea, lee, actualiza y elimina productos.
- **Gestión de Ventas**: Registra nuevas ventas asociadas a clientes.
- **Autenticación de Usuarios**: Sistema de login con credenciales (usuario y contraseña).
- **Roles de Usuario**: Roles de Administrador y Usuario normal.
- **Panel de Administrador**: Los administradores pueden gestionar (CRUD) a otros usuarios.
- **Aislamiento de Datos**: Cada usuario solo puede ver y gestionar sus propios clientes y ventas. Los productos son compartidos.
- **Dashboard Principal**: Vista rápida de ingresos, número de ventas y total de clientes.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: MySQL
- **ORM**: Prisma
- **UI**: React Bootstrap & SASS
- **Autenticación**: NextAuth.js

---

## Guía de Instalación y Despliegue

### Prerrequisitos

- Node.js (v18 o superior)
- npm, yarn, o pnpm
- Una base de datos MySQL

### Instalación Local

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/fvnks/seguimiento-clientes.git
    cd seguimiento-clientes
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables. Puedes usar el archivo `.env.example` como guía.

4.  **Sincroniza la base de datos:**
    Este comando aplicará el schema de Prisma a tu base de datos.
    ```bash
    npx prisma db push
    ```

5.  **Crea el usuario administrador inicial:**
    Este comando ejecutará el script `seed` para crear el usuario administrador (`rdroguetts` / `961173`).
    ```bash
    npx prisma db seed
    ```

6.  **Ejecuta el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

    Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Variables de Entorno

Crea un archivo `.env` con el siguiente contenido, reemplazando los valores con los tuyos:

```env
# URL de conexión a tu base de datos MySQL.
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# Secreto para NextAuth.js. Genera uno en https://generate-secret.vercel.app/32
NEXTAUTH_SECRET="tu_secreto_aqui"

# URL de tu aplicación (para desarrollo y producción en Vercel)
NEXTAUTH_URL="http://localhost:3000"
```

---

## Despliegue en Vercel

El despliegue en Vercel es la forma más sencilla de poner esta aplicación en producción.

### 1. Base de Datos

Antes de desplegar, necesitas una base de datos MySQL accesible desde internet. Vercel ofrece varias opciones:
- **Vercel Storage**: La opción más sencilla es usar **Vercel Postgres** (compatible con Prisma) o **Vercel KV**.
- **Proveedores Externos**: Puedes usar proveedores como [PlanetScale](https://planetscale.com/), [Aiven](https://aiven.io/), o cualquier otro que ofrezca bases de datos MySQL en la nube.

Una vez que tengas tu base de datos, obtén la **URL de conexión**. La necesitarás para el siguiente paso.

### 2. Importar Proyecto en Vercel

1.  **Regístrate o inicia sesión** en [Vercel](https://vercel.com).
2.  **Importa tu repositorio de GitHub** (`fvnks/seguimiento-clientes`). Vercel detectará automáticamente que es un proyecto de Next.js.

### 3. Configurar Variables de Entorno

Durante el proceso de importación, Vercel te pedirá configurar las variables de entorno. Ve a la sección **Environment Variables** y añade las mismas que tienes en tu archivo `.env`:

-   `DATABASE_URL`: Pega aquí la URL de conexión de tu base de datos de producción (la que obtuviste en el paso 1).
-   `NEXTAUTH_SECRET`: Un secreto único y seguro para tu aplicación en producción.
-   `NEXTAUTH_URL`: Vercel la configura automáticamente, pero si no, será la URL de tu aplicación (ej: `https://seguimiento-clientes.vercel.app`).

### 4. Desplegar

-   Haz clic en el botón **Deploy**. Vercel se encargará de construir y desplegar tu aplicación.
-   **¡Importante!** Después del primer despliegue, la base de datos estará vacía. Para crear el usuario administrador, necesitarás ejecutar el comando `seed` en el entorno de Vercel. Puedes hacerlo modificando temporalmente el comando de `build` en `package.json` para que también ejecute el `seed`:

    ```json
    "build": "prisma generate && prisma db push && prisma db seed && next build"
    ```

    Después de un despliegue exitoso con este comando, es recomendable quitar `prisma db seed` para que no se ejecute en cada build.

¡Y listo! Tu aplicación estará desplegada y funcionando en Vercel.