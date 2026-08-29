const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('admin123', 10);
  const vendedorPass = await bcrypt.hash('vendedor123', 10);
  const bodegaPass = await bcrypt.hash('bodega123', 10);

  await prisma.$executeRawUnsafe(`
    UPDATE usuario SET password_hash = '${adminPass}' WHERE email = 'admin@tienda360.com';
  `);
  console.log('✅ Contraseña de admin@tienda360.com actualizada a: admin123');

  await prisma.$executeRawUnsafe(`
    UPDATE usuario SET password_hash = '${vendedorPass}' WHERE email = 'vendedor@tienda360.com' OR email = 'vendedor@tienda.com';
  `);
  console.log('✅ Contraseña de vendedor@tienda360.com actualizada a: vendedor123');

  await prisma.$executeRawUnsafe(`
    UPDATE usuario SET password_hash = '${bodegaPass}' WHERE email = 'bodega@tienda360.com' OR email = 'bodega@tienda.com';
  `);
  console.log('✅ Contraseña de bodega@tienda360.com actualizada a: bodega123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
