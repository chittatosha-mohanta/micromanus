import { seedDefaultPricing } from '../src/services/pricing';

async function main() {
  console.log('🌱 Seeding database...');
  
  try {
    await seedDefaultPricing();
    console.log('✅ Model pricing seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
