'use client';
import React from "react";
import Link from "next/link";

const RegisterArea = () => {
  return (
    <>
      <section className="tp-login-area relative w-full h-screen flex">
        {/* Left Side - Info/Brand */}
        <div className="hidden md:flex w-1/2 bg-cover bg-center items-center justify-center p-12"
          style={{ backgroundImage: "url('/images/fabric-bg.jpg')" }}>
          <div className="bg-black bg-opacity-50 p-10 rounded-2xl text-white max-w-md">
            <img src="https://amritafashions.com/wp-content/uploads/amrita-fashions-company-logo-150x150.webp" alt="Fabrito Logo" className="mb-6 w-32" />
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
            <h3 className="text-2xl font-bold mb-2">Signup</h3>
            <p className="mb-6 text-gray-600">
              Already a member?{" "}
              <Link href="/login" className="text-red-600 font-semibold">Login</Link>
            </p>

            {/* Register Form */}
            <form className="space-y-5">
              <div>
                <input type="text" placeholder="Full Name"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <input type="text" placeholder="Business Name"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <input type="email" placeholder="Email"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <input type="tel" placeholder="Phone Number"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="relative">
                <input type="password" placeholder="Enter your password"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
                <span className="absolute right-3 top-3 cursor-pointer text-gray-500">👁️</span>
              </div>
              <div className="flex items-center">
                <input id="terms" type="checkbox" className="mr-2" />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the <a href="#" className="underline">Terms and Conditions</a> and <a href="#" className="underline">Privacy Policy</a>.
                </label>
              </div>
              <button type="submit"
                className="w-full bg-red-600 text-white py-2 rounded-md font-semibold hover:bg-red-700 transition">
                Signup
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default RegisterArea;
