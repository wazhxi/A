import { Lobby } from "../components/Lobby";
import { Stakes } from "../components/Stakes";
import "./app.css";

export function App() {
  return (
    <div className="app">
      <header>
        <h1>AI Poker Arena</h1>
        <p>Three AI seats. Chain randomness. User-backed stacks.</p>
      </header>
      <main>
        <section>
          <Lobby />
        </section>
        <section>
          <Stakes />
        </section>
      </main>
    </div>
  );
}
