interface GreetingProps {
  greeting: string;
  showSecret: boolean;
}

export const Greeting: React.FC<GreetingProps> = ({ greeting, showSecret }) => {
  if (showSecret) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div className="z-30">
        <h1 className="text-4xl font-bold mb-8 text-center">{greeting}</h1>
      </div>
    </div>
  );
};
