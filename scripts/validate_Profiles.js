// validateProfiles.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'fighter_profiles.json');

// Define required fields and their types
const requiredFields = {
  name: 'string',
  tier: 'string',
  winLoss: 'object',
  ticketStats: 'object',
  cardStats: 'object',
  resaleStats: 'object',
  news: 'object'
};

const validTiers = ['PPV Star', 'A-Level Draw', 'Regional Headliner', 'Fringe Contender'];

function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

function validateFighter(fighter, index) {
  const errors = [];

  // Check required fields and types
  for (const field in requiredFields) {
    if (!(field in fighter)) {
      errors.push(`Missing field "${field}"`);
    } else if (typeof fighter[field] !== requiredFields[field]) {
      errors.push(`Incorrect type for "${field}" — expected ${requiredFields[field]}`);
    }
  }

  // Tier check
  if (fighter.tier && !validTiers.includes(fighter.tier)) {
    errors.push(`Invalid tier "${fighter.tier}" — must be one of: ${validTiers.join(', ')}`);
  }

  // Win/loss check
  if (fighter.winLoss) {
    const { wins, losses, draws } = fighter.winLoss;
    if (![wins, losses, draws].every(n => typeof n === 'number')) {
      errors.push(`winLoss must have numeric "wins", "losses", and "draws"`);
    }
  }

  // Check news array and sources
  if (fighter.news && Array.isArray(fighter.news)) {
    fighter.news.forEach((article, i) => {
      if (!article.title || !article.source || !article.url) {
        errors.push(`News item ${i} missing "title", "source", or "url"`);
      } else if (!validateURL(article.url)) {
        errors.push(`News item ${i} has invalid URL`);
      }
    });
  } else {
    errors.push(`"news" should be an array`);
  }

  return errors;
}

function runValidation() {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(data)) {
      console.error('❌ Top-level JSON must be an array of fighters');
      return;
    }

    let allValid = true;

    data.forEach((fighter, i) => {
      const errors = validateFighter(fighter, i);
      if (errors.length > 0) {
        allValid = false;
        console.log(`\n❌ Fighter at index ${i} (${fighter.name || 'Unnamed'}):`);
        errors.forEach(err => console.log(`  - ${err}`));
      }
    });

    if (allValid) {
      console.log('\n✅ All fighter profiles passed validation!');
    }

  } catch (e) {
    console.error(`❌ Failed to read or parse fighter_profiles.json:`, e.message);
  }
}

runValidation();
