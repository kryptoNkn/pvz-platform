import React from "react";
import s from "./App.module.scss";

function App() {
  return (
    <div className={s.app}>
      <header className={s.appHeader}>
        <h1>PVZ Platform</h1>
        <h2>Eгорик и Данечка</h2>
      </header>

      <main className={s.appMain}>
        <p>сделайте все по красоте</p>
      </main>
    </div>
  );
}

export default App;