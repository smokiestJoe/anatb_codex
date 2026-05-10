import React from "react";

export function IntroScreen({ onSkip }) {
  return (
    <section className="screen intro-screen">
      <div className="intro-window">
        <div className="intro-scroll">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <p>Integer vel augue non magna blandit gravida. The barn waits past the hedge, leaning into the lane like a secret with hinges.</p>
          <p>Sed euismod, risus at fermentum porttitor, nunc neque dapibus eros, sed tempor mi metus at nulla.</p>
          <p>Tonight, every ordinary thing has a second job.</p>
        </div>
      </div>
      <button className="skip" onClick={onSkip}>Skip</button>
    </section>
  );
}
