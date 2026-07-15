import React from "react";
import { styles } from "./shared.js";

export default function Avatar({ player, size = 40 }) {
  const dim = { width: size, height: size, fontSize: size * 0.36 };
  if (player.photo) {
    return (
      <img
        src={player.photo}
        alt={player.name}
        style={{ ...styles.avatarSmall, ...dim, objectFit: "cover" }}
      />
    );
  }
  return (
    <div style={{ ...styles.avatarSmall, ...dim }}>
      {player.number ? player.number : player.name.charAt(0).toUpperCase()}
    </div>
  );
}
