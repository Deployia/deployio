const authService = require("../services/authService");

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email, and password",
      });
    }

    // Register user
    const { user, token } = await authService.registerUser({
      username,
      email,
      password,
    }); // Set JWT as an HTTP-only cookie
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict",
    };

    res.cookie("token", token, cookieOptions);

    // Return user data (without password)
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Login user
    const { user, token } = await authService.loginUser(email, password); // Set JWT as an HTTP-only cookie
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict",
    };

    res.cookie("token", token, cookieOptions);

    // Return user data (without password)
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Send password reset email
 * @route POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email address",
      });
    }

    // Get frontend URL based on environment
    const frontendUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    // Send password reset email
    const result = await authService.forgotPassword(email, frontendUrl);

    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reset password using token
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate input fields
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide new password",
      });
    }

    // Reset password
    const result = await authService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update user password
 * @route PUT /api/auth/update-password
 * @access Private
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    // Update password
    const result = await authService.updatePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Logout user
 * @route GET /api/auth/logout
 * @access Private
 */
const logout = async (req, res) => {
  try {
    // Get user information from the request object
    const userId = req.user._id;

    // Call the logout service with user ID
    const result = await authService.logoutUser(userId);

    // Clear the cookie containing the token
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
      httpOnly: true,
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during logout",
    });
  }
};

/**
 * Get current authenticated user
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.status(200).json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  logout,
  getMe,
};
