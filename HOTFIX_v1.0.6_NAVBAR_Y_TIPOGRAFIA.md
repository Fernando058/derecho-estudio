# Lex Academia v1.0.6 — Navbar y contraste tipográfico

## Cambios

### Navbar
Se reemplaza el retorno flotante al Dashboard por una barra de navegación superior
persistente y de mayor visibilidad.

Incluye, según el estado de sesión:
- Inicio
- Dashboard
- Biblioteca
- Acerca de
- Administración (si corresponde)
- Ingresar / Registrarse
- Mi perfil

La administración conserva su navegación lateral propia.

### Contraste en recuadros azules
Los títulos y textos principales de las cabeceras azul oscuro reciben un contorno/sombra
sutil para que la tipografía se diferencie mejor del fondo y conserve legibilidad.

### Responsive
La navbar se adapta a escritorio, tablet y móvil, permitiendo desplazamiento horizontal
de las opciones cuando el ancho es reducido.

## Base de datos
No hay migraciones ni cambios SQL.
No ejecutar `supabase db push`.
