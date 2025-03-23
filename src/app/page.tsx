import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Welcome to Chamos</h1>
        <p className="text-xl mb-4">Your Social Fitness Journey Starts Here</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Track Progress</h2>
            <p>Log your workouts, weight, and measurements</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Connect with Friends</h2>
            <p>Share your journey and motivate each other</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Set Goals</h2>
            <p>Create and track your fitness goals</p>
          </div>
        </div>
      </div>
    </main>
  );
}
