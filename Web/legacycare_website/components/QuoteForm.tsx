"use client";

import { FormEvent, useState } from "react";
import Button from "./Button";

export default function QuoteForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Full Name
          </label>

          <input
            type="text"
            name="name"
            required
            className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-gray-600"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Phone Number
          </label>

          <input
            type="tel"
            name="phone"
            required
            className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-gray-600"
            placeholder="Your phone number"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            required
            className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-gray-600"
            placeholder="Your email address"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Message
          </label>

          <textarea
            name="message"
            rows={5}
            required
            className="w-full resize-none rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-gray-600"
            placeholder="How can we help you?"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button>Request Information</Button>
      </div>

      {submitted && (
        <p className="mt-4 rounded-md bg-gray-100 p-4 text-sm text-gray-700">
          Thank you. Your request has been received.
        </p>
      )}
    </form>
  );
}