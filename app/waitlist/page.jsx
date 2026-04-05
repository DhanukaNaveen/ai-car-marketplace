"use client";

import React from "react";
import Head from "next/head";

export default function WaitlistPage() {
  return (
    <>
      <Head>
        <title>Waitlist</title>
      </Head>
      <div className="mt-20 fixed w-full">
        <div className="aspect-video w-full">
          <iframe
            src="https://makeform.ai/f/Eb1Wd6AE"
            className="w-full h-full"
            frameBorder="0"
            marginHeight="0"
            marginWidth="0"
          >
            Loading…
          </iframe>
        </div>
      </div>
    </>
  );
}
