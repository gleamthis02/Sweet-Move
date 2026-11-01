
import PoseCamera from "@/components/pose/PoseCamera";

export default function ExercisePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            Sweet Move
          </h1>

          <p className="text-gray-600 mt-2">
            AI Exercise Tracking
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Camera & Pose Detection
          </h2>

          <PoseCamera />
        </section>
      </div>
    </main>
  );
}
