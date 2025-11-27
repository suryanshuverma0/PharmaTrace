// Add this to your main server.js or app.js file in the routes section

// Blockchain verification routes
app.use('/api/blockchain', require('./routes/blockchainVerificationRoutes'));

// Or if you're using a routes index file, add this line to routes/index.js:
// router.use('/blockchain', require('./blockchainVerificationRoutes'));