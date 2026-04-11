import React from "react";
import { Button } from "./ui/button";
import { Heart, CarFront, Layout, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";

const Header = async ({ isAdminPage = false }) => {
  const user = await checkUser();
  const isAdmin = user?.role === "ADMIN";// isAdmin is determined by checking the user's role, which is fetched using the checkUser function. If the user's role is "ADMIN", then isAdmin will be true, allowing us to conditionally render admin-specific links and buttons in the header.

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={isAdminPage ? "/admin" : "/"} className="flex"> 
          <Image
            src={"/logo.png"}
            alt="Vehiql Logo"
            width={200}
            height={60}
            className="h-12 w-auto object-contain"
          />
          
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {isAdminPage ? (  // If we're on an admin page, show a back button instead of the usual links. This is determined by the isAdminPage prop passed to the Header component. If isAdminPage is true, it means we're on an admin page, and we render a button that links back to the main app. Otherwise, we render the regular navigation links for signed-in users.
            <>
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft size={18} />
                  <span>Back to App</span>
                </Button>
              </Link>
            </>
          ) : (
            <SignedIn>  
              
                <Link
                  href="/reservations"
                  className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
                >
                  <Button variant="outline">
                    <CarFront size={18} />
                    <span className="hidden md:inline">My Reservations</span>
                  </Button>
                </Link>
              <a href="/saved-cars">
                <Button className="flex items-center gap-2">
                  <Heart size={18} />
                  <span className="hidden md:inline">Saved Cars</span>
                </Button>
              </a>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Layout size={18} />
                    <span className="hidden md:inline">Admin Portal</span>
                  </Button>
                </Link>
              )}
            </SignedIn>  // If the user is signed in,but not on an admin page, we show the regular navigation links for reservations, saved cars, and the admin portal (if the user is an admin).
          )}

          <SignedOut>
            {!isAdminPage && (
              <SignInButton forceRedirectUrl="/">  
                <Button variant="outline">Login</Button>
              </SignInButton>    //login button that redirects to the home page after signing in. This button is only shown if the user is signed out and not on an admin page, as determined by the SignedOut component and the isAdminPage prop.
            )}
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
