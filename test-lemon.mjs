import 'dotenv/config';

const email = "socials@doorwaymusic.com";

const res = await fetch(
  `https://api.lemonsqueezy.com/v1/customers?filter[email]=${encodeURIComponent(email)}`,
  {
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
    },
  }
);

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
