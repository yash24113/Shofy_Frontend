'use client';
import React from "react";
import Link from "next/link";

const LoginArea = () => {
  return (
    <>
      <section className="tp-login-area relative w-full h-screen flex">
        {/* Left Side - Info/Brand */}
        <div className="hidden md:flex w-1/2 bg-cover bg-center items-center justify-center p-12"
          style={{ backgroundImage: "url('/images/fabric-bg.jpg')" }}>
          <div className="bg-black bg-opacity-50 p-10 rounded-2xl text-white max-w-md">
            <img src="/images/logo.png" alt="Fabrito Logo" className="mb-6 w-32" />
            <h2 className="text-2xl font-bold mb-4">One-Stop Solution For All Your Fabric Sourcing Needs</h2>
            <ul className="space-y-3 text-sm">
              <li>✅ Browse through 1000s of ready fabrics</li>
              <li>✅ Free swatches for better decision making</li>
              <li>✅ End-to-end order visibility</li>
              <li>✅ Lowest MOQs in the industry</li>
            </ul>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex w-full md:w-1/2 items-center justify-center bg-white">
          <div className="max-w-md w-full p-8">
            <h3 className="text-2xl font-bold mb-2">Login</h3>
            <p className="mb-6 text-gray-600">
              Don’t have an account?{" "}
              <Link href="/register" className="text-red-600 font-semibold">Signup</Link>
            </p>

            {/* Login Form */}
            <form className="space-y-5">
              <div>
                <input type="email" placeholder="Email"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="relative">
                <input type="password" placeholder="Password"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
                <span className="absolute right-3 top-3 cursor-pointer text-gray-500">👁️</span>
              </div>
              <div className="text-right">
                <a href="#" className="text-sm text-gray-600 hover:underline">I forgot my password</a>
              </div>
              <button type="submit"
                className="w-full bg-red-600 text-white py-2 rounded-md font-semibold hover:bg-red-700 transition">
                Login
              </button>

              <div className="flex items-center justify-center space-x-2 my-4">
                <span className="h-px w-20 bg-gray-300"></span>
                <span className="text-gray-500 text-sm">or</span>
                <span className="h-px w-20 bg-gray-300"></span>
              </div>

              <button type="button"
                className="w-full border border-gray-400 py-2 rounded-md flex items-center justify-center space-x-2 hover:bg-gray-50">
                <span>📱</span> <span>Login with OTP</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default LoginArea;
