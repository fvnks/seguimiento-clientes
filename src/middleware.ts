export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    '/admin/:path*',
    '/calendario',
    '/categorias',
    '/clientes/:path*',
    '/configuracion',
    '/productos/:path*',
    '/reportes',
    '/ventas/:path*'
  ],
};
