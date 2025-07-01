const addressGreetings = [
  // Fuck boy
  "Yo! ",
  "Sup! ",
  "What's good! ",
  "Hey! ",
  "Lookin' slick! ",

  // Poker brat
  "High stakes! ",
  "Deal me in! ",
  "Bet big! ",
  "Fold or play! ",
  "Nice hand! ",

  // Skateboarder
  "Shred the chain! ",
  "Kickin' it! ",
  "Gnarly! ",
  "Catch the flow! ",
  "Roll on! ",

  // Rock star
  "Rockstar vibes! ",
  "Amp it up! ",
  "Let's jam! ",
  "Stay loud! ",
  "Encore moment! ",

  // Hippie
  "Peace! ",
  "Cosmic energy! ",
  "Groovy! ",
  "Far out! ",
  "Vibes aligned! ",
];

export function getAddressGreeting(address?: string) {
  const randomGreeting =
    addressGreetings[Math.floor(Math.random() * addressGreetings.length)];
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Guest";

  return `${randomGreeting}`;
  // ${shortAddress}`;
}
