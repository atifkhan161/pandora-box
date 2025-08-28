// Test login functionality
async function testLogin() {
  try {
    const response = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
        rememberMe: false
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Login successful!')
      console.log('Token:', data.data.token.substring(0, 20) + '...')
      console.log('User:', data.data.user)
    } else {
      console.log('❌ Login failed:', data)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testLogin()