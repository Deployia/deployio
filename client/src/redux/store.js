import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import twoFactorReducer from "./slices/twoFactorSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  twoFactor: twoFactorReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export default store;
