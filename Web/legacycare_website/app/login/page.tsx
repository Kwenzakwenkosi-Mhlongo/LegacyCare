"use client";

import Image from "next/image";
import { useState } from "react";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { EyeIcon, EyeCloseIcon } from "@/icons";
import { useRouter } from "next/navigation";
import { login } from "@/lib/authService";
import { saveAuth } from "@/lib/auth";


export default function LoginForm() {
  const router = useRouter();
  {/*-----------------STATES-----------------*/}
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");


  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setIsLoading(true); 

    try {
        const response = await login(email, password);
        
        saveAuth({
            token: response.token,
            fullName: response.fullName,
            email: response.email,
            role: response.role
        });

    switch (response.role) {
        case "Admin":
            router.push("/admin");
            break;
        
        case "Staff":
            router.push("/staff/dashboard");
            break;

        case "Clerk":
            router.push("/clerk/dashboard");
            break;

        case "Client":
            router.push("/client/dashboard");
            break;

        default:
            router.push("/");
            break;
  }
    } 
    catch (error: any) {
        setError(error.message);
    } 
    finally {
        setIsLoading(false);
    }
  };

  

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex relative w-1/2 overflow-hidden">
        <Image
          src="/images/login/login-bg.png"
          alt="Background"
          fill
          priority
          className="object-cover"
        />
        {/* Light Overlay */}
        <div className="absolute inset-0 bg-white/10"></div>

        {/* LOGO + TITLE */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <Image
            src="/images/login/logo.png"
            alt="LegacyCare Logo"
            width={200} height={200}
            priority
          />
          {/* Title */}
          <h1 className="mt-6 text-6xl font-serif font-semibold text-slate-900">
            Legacy<span className="text-teal-600">Care</span>
          </h1>

          <p className="mt-4 text-xl text-gray-700">
            Seamless management for life's final chapter.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE- FORM */}
      <div className="flex flex-1 item-center justify-center p-10">
        <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl p-10">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-slate-900">
              Welcome Back
            </h2>
            <p className="mt-3 text-gray-500 text-lg">
              Sign In to continue to LegacyCare
            </p>
          </div>
          {/* FORM */}
          <form className="mt-10 space-y-6"
          onSubmit={handleSubmit}>

            {/* Email */}
            <div>
              <Label>Email Address</Label>
              <Input type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {/* Password */}
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                className="h-14 rounded-xl"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 cursor-pointer"
                >
                  {showPassword ? (<EyeIcon className="h-5 w-5" />)
                    : (<EyeCloseIcon className="h-5 w-5" />)}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={remember}
                  onChange={setRemember}
                />
                <span className="text-sm">
                  Remember me
                </span>
              </div>

              <Link href="/reset-password"
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                Forgot password?
              </Link>
            </div>

            {/* Button */}
            {error && (
                <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}
            <Button className="w-full h-14 rounded-xl bg-teal-600 hover:bg-teal-700 text-lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-300"></div>
              <span className="text-gray-400">OR</span>
              <div className="h-px flex-1 bg-gray-300"></div>
            </div>

            <p className="text-center text-gray-500">
              Don't have an account?{" "}
              <span className="text-teal-600">
                Contact your administrator.
              </span>
            </p>
          </form>

          {/* FOOTER */}
          <div className="mt-10 text-center text-sm text-gray-5000">
            Secure. Reliable. Compassionate.
          </div>
        </div>
      </div>
    </div>
  );
}