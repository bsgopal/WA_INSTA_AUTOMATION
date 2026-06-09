// Test script to verify the fix for "Daily wear i need it" message with image
require('dotenv').config();
const mongoose = require('mongoose');
const analyzer = require('./services/aiMessageAnalyzer');

async function testDailyWearMessage() {
  try {
    
    console.log('\n=== Testing Daily Wear Message Fix ===\n');
    
    // Test 1: isReferenceImageMessage - should return FALSE for "Daily wear i need it"
    console.log('Test 1: isReferenceImageMessage("Daily wear i need it")');
    const messageText = 'Daily wear i need it';
    const isReference = analyzer.isReferenceImageMessage(messageText);
    console.log(`Result: ${isReference} (Expected: false)`);
    console.log(`Status: ${!isReference ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Test 2: isReferenceImageMessage - should return TRUE for empty message with image
    console.log('Test 2: isReferenceImageMessage("") [empty message]');
    const isReferenceEmpty = analyzer.isReferenceImageMessage('');
    console.log(`Result: ${isReferenceEmpty} (Expected: true)`);
    console.log(`Status: ${isReferenceEmpty ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Test 3: detectCategorySelection - should return BANGLES for "daily wear"
    console.log('Test 3: detectCategorySelection("Daily wear i need it")');
    const category = await analyzer.detectCategorySelection(messageText);
    console.log(`Result: ${category} (Expected: BANGLES)`);
    console.log(`Status: ${category === 'BANGLES' ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Test 4: isReferenceImageMessage with strong reference keyword
    console.log('Test 4: isReferenceImageMessage("Can you make this design") [should be TRUE]');
    const isStrongReference = analyzer.isReferenceImageMessage('Can you make this design');
    console.log(`Result: ${isStrongReference} (Expected: true)`);
    console.log(`Status: ${isStrongReference ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Test 5: detectCategorySelection - should return RINGS for "ring"
    console.log('Test 5: detectCategorySelection("ring")');
    const categoryRing = await analyzer.detectCategorySelection('ring');
    console.log(`Result: ${categoryRing} (Expected: RINGS)`);
    console.log(`Status: ${categoryRing === 'RINGS' ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Test 6: detectCategorySelection - other daily wear patterns
    console.log('Test 6: detectCategorySelection("everyday wear needed")');
    const categoryEveryday = await analyzer.detectCategorySelection('everyday wear needed');
    console.log(`Result: ${categoryEveryday} (Expected: BANGLES)`);
    console.log(`Status: ${categoryEveryday === 'BANGLES' ? '✅ PASS' : '❌ FAIL'}\n`);
    
    console.log('=== Test Summary ===');
    console.log('All tests completed. The fix should now properly handle messages like "Daily wear i need it"');
    console.log('Expected behavior:');
    console.log('1. Message is NOT treated as a design reference (isReferenceImageMessage = false)');
    console.log('2. Message is detected as a BANGLES category query');
    console.log('3. System will now respond with bangles catalog instead of generic design consultation prompt\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Test Error:', error.message);
    process.exit(1);
  }
}

testDailyWearMessage();
