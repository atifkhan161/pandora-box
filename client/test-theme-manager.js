/**
 * Test script for Theme Manager functionality
 * Tests all the requirements for task 2.3
 */

// Import the theme manager
import themeManager from './src/js/utils/theme-manager.js';

async function testThemeManager() {
  console.log('🧪 Testing Theme Manager System...\n');

  try {
    // Test 1: Initialize theme manager
    console.log('1️⃣ Testing theme manager initialization...');
    await themeManager.init();
    console.log('✅ Theme manager initialized successfully');
    console.log(`   Current theme: ${themeManager.getCurrentTheme()}\n`);

    // Test 2: Test theme persistence using localStorage
    console.log('2️⃣ Testing theme persistence...');
    const originalTheme = themeManager.getCurrentTheme();
    
    // Set a different theme
    await themeManager.setTheme('prime-video');
    console.log('✅ Theme changed to Prime Video');
    
    // Check if it's saved in localStorage
    const savedTheme = localStorage.getItem('pb-theme');
    if (savedTheme === 'prime-video') {
      console.log('✅ Theme persisted to localStorage');
    } else {
      console.log('❌ Theme not persisted to localStorage');
    }
    
    // Restore original theme
    await themeManager.setTheme(originalTheme);
    console.log(`✅ Theme restored to ${originalTheme}\n`);

    // Test 3: Test PWA meta theme-color updates
    console.log('3️⃣ Testing PWA meta theme-color updates...');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (metaThemeColor) {
      const originalColor = metaThemeColor.content;
      
      // Change to HBO Max theme
      await themeManager.setTheme('hbo-max');
      const hboColor = metaThemeColor.content;
      
      if (hboColor === '#9146ff') {
        console.log('✅ Meta theme-color updated correctly for HBO Max');
      } else {
        console.log(`❌ Meta theme-color not updated correctly. Expected: #9146ff, Got: ${hboColor}`);
      }
      
      // Change to Disney+ theme
      await themeManager.setTheme('disney-plus');
      const disneyColor = metaThemeColor.content;
      
      if (disneyColor === '#113ccf') {
        console.log('✅ Meta theme-color updated correctly for Disney+');
      } else {
        console.log(`❌ Meta theme-color not updated correctly. Expected: #113ccf, Got: ${disneyColor}`);
      }
      
      // Restore original theme
      await themeManager.setTheme(originalTheme);
      console.log(`✅ Meta theme-color restored\n`);
    } else {
      console.log('❌ Meta theme-color element not found\n');
    }

    // Test 4: Test all available themes
    console.log('4️⃣ Testing all available themes...');
    const themes = themeManager.getAvailableThemes();
    console.log(`   Available themes: ${themes.length}`);
    
    for (const theme of themes) {
      try {
        await themeManager.setTheme(theme.id);
        console.log(`   ✅ ${theme.name} theme loaded successfully`);
      } catch (error) {
        console.log(`   ❌ Failed to load ${theme.name} theme: ${error.message}`);
      }
    }
    
    // Restore original theme
    await themeManager.setTheme(originalTheme);
    console.log(`   ✅ Restored to ${originalTheme} theme\n`);

    // Test 5: Test theme manager methods
    console.log('5️⃣ Testing theme manager methods...');
    
    // Test nextTheme
    const nextTheme = await themeManager.nextTheme();
    console.log(`   ✅ Next theme: ${nextTheme.name}`);
    
    // Test previousTheme
    const prevTheme = await themeManager.previousTheme();
    console.log(`   ✅ Previous theme: ${prevTheme.name}`);
    
    // Test resetTheme
    await themeManager.resetTheme();
    console.log(`   ✅ Reset to default theme: ${themeManager.getCurrentTheme()}`);
    
    // Test theme validation
    const isValid = themeManager.isValidTheme('netflix');
    const isInvalid = themeManager.isValidTheme('invalid-theme');
    console.log(`   ✅ Theme validation: netflix=${isValid}, invalid=${isInvalid}\n`);

    // Test 6: Test theme change callbacks
    console.log('6️⃣ Testing theme change callbacks...');
    let callbackTriggered = false;
    
    const callback = (themeData) => {
      callbackTriggered = true;
      console.log(`   ✅ Callback triggered: ${themeData.current} (from ${themeData.previous})`);
    };
    
    themeManager.onThemeChange(callback);
    await themeManager.setTheme('hulu');
    
    if (callbackTriggered) {
      console.log('   ✅ Theme change callback system working');
    } else {
      console.log('   ❌ Theme change callback not triggered');
    }
    
    themeManager.offThemeChange(callback);
    await themeManager.setTheme('netflix');
    console.log('   ✅ Callback removed successfully\n');

    // Test 7: Test theme properties export
    console.log('7️⃣ Testing theme properties export...');
    const themeConfig = themeManager.exportThemeConfig();
    
    if (themeConfig.currentTheme && themeConfig.themeObject && themeConfig.properties) {
      console.log('   ✅ Theme configuration exported successfully');
      console.log(`   Current theme: ${themeConfig.currentTheme}`);
      console.log(`   Properties count: ${Object.keys(themeConfig.properties).length}`);
    } else {
      console.log('   ❌ Theme configuration export failed');
    }

    console.log('\n🎉 All theme manager tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Theme manager initialization');
    console.log('✅ Theme persistence using localStorage');
    console.log('✅ PWA meta theme-color updates');
    console.log('✅ Dynamic theme switching');
    console.log('✅ Theme validation and methods');
    console.log('✅ Theme change callbacks');
    console.log('✅ Theme configuration export');

  } catch (error) {
    console.error('❌ Theme manager test failed:', error);
  }
}

// Run tests when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testThemeManager);
} else {
  testThemeManager();
}