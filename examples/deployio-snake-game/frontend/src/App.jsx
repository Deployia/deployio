import React, { useState, useEffect, useRef } from "react";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const gameLoopRef = useRef(null);

  // Fetch leaderboard
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = {
          x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
        };

        // Check collision with self
        if (
          prevSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y,
          )
        ) {
          setGameOver(true);
          return prevSnake;
        }

        let newSnake = [newHead, ...prevSnake];

        // Check if ate food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 10);
          setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 200);

    return () => clearInterval(gameLoopRef.current);
  }, [direction, food, gameOver]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") {
        setDirection({ x: 0, y: -1 });
        e.preventDefault();
      } else if (key === "arrowdown" || key === "s") {
        setDirection({ x: 0, y: 1 });
        e.preventDefault();
      } else if (key === "arrowleft" || key === "a") {
        setDirection({ x: -1, y: 0 });
        e.preventDefault();
      } else if (key === "arrowright" || key === "d") {
        setDirection({ x: 1, y: 0 });
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    setShowNameInput(false);
  };

  const saveScore = async () => {
    if (!playerName.trim()) return;
    try {
      await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_name: playerName, score }),
      });
      fetchLeaderboard();
      resetGame();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🐍 Snake Game</h1>
        <p>Score: {score}</p>
      </div>

      <div style={styles.gameArea}>
        <div style={styles.grid}>
          {/* Draw grid cells */}
          {Array.from({ length: GRID_SIZE }).map((_, y) =>
            Array.from({ length: GRID_SIZE }).map((_, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  ...styles.cell,
                  backgroundColor: snake.some((s) => s.x === x && s.y === y)
                    ? "#00ffc8"
                    : food.x === x && food.y === y
                      ? "#ff00ff"
                      : "#0f0f1e",
                  boxShadow: snake.some((s) => s.x === x && s.y === y)
                    ? "0 0 10px rgba(0, 255, 200, 0.6), inset 0 0 10px rgba(0, 255, 200, 0.3)"
                    : food.x === x && food.y === y
                      ? "0 0 10px rgba(255, 0, 255, 0.6)"
                      : "none",
                }}
              />
            )),
          )}
        </div>

        {gameOver && (
          <div style={styles.gameOverModal}>
            <div style={styles.modalContent}>
              <h2 style={{ color: "#00ffc8", fontSize: "2.5em", marginBottom: "20px" }}>Game Over!</h2>
              <p
                style={{
                  fontSize: "2em",
                  fontWeight: "bold",
                  color: "#00ffc8",
                  marginY: "20px",
                  textShadow: "0 0 15px rgba(0, 255, 200, 0.5)",
                }}
              >
                Score: {score}
              </p>
              {!showNameInput ? (
                <>
                  <button
                    style={styles.btn}
                    onClick={() => setShowNameInput(true)}
                  >
                    Save to Leaderboard
                  </button>
                  <button
                    style={{
                      ...styles.btn,
                      background: "linear-gradient(135deg, #ff00ff 0%, #ff0080 100%)",
                      color: "white",
                      marginTop: "10px",
                      boxShadow: "0 0 15px rgba(255, 0, 255, 0.4)",
                    }}
                    onClick={resetGame}
                  >
                    Play Again
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    style={styles.input}
                    onKeyPress={(e) => e.key === "Enter" && saveScore()}
                  />
                  <button style={styles.btn} onClick={saveScore}>
                    Save Score
                  </button>
                  <button
                    style={{
                      ...styles.btn,
                      background: "linear-gradient(135deg, #a0aec0 0%, #718096 100%)",
                      color: "white",
                      marginTop: "10px",
                      boxShadow: "0 0 15px rgba(160, 174, 192, 0.4)",
                    }}
                    onClick={() => setShowNameInput(false)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={styles.leaderboard}>
        <h3>🏆 Leaderboard</h3>
        <div style={styles.leaderboardList}>
          {leaderboard.length === 0 ? (
            <p style={{ textAlign: "center", color: "rgba(0, 255, 200, 0.5)" }}>
              No scores yet. Be the first!
            </p>
          ) : (
            leaderboard.map((entry) => (
              <div key={entry.rank} style={styles.leaderboardEntry}>
                <span style={{ color: "#ff00ff", fontWeight: "bold" }}>#{entry.rank}</span>
                <span style={{ color: "#00ffc8" }}>{entry.player}</span>
                <span style={{ color: "#ff00ff", fontWeight: "bold" }}>
                  {entry.score}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <p style={styles.instructions}>
        Use Arrow Keys or WASD to move • Don't hit walls or yourself!
      </p>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "800px",
    background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 30px 80px rgba(0, 255, 200, 0.2), 0 20px 60px rgba(0, 0, 0, 0.5)",
    border: "2px solid rgba(0, 255, 200, 0.3)",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#00ffc8",
    textShadow: "0 0 20px rgba(0, 255, 200, 0.5)",
  },
  gameArea: {
    position: "relative",
    marginBottom: "30px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
    gap: "2px",
    backgroundColor: "#1a1a2e",
    padding: "8px",
    borderRadius: "12px",
    aspectRatio: "1",
    border: "3px solid #00ffc8",
    boxShadow: "0 0 20px rgba(0, 255, 200, 0.3), inset 0 0 20px rgba(0, 255, 200, 0.1)",
  },
  cell: {
    width: "100%",
    aspectRatio: "1",
    backgroundColor: "#0f0f1e",
    borderRadius: "2px",
  },
  gameOverModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    backdropFilter: "blur(5px)",
    border: "2px solid rgba(0, 255, 200, 0.3)",
  },
  modalContent: {
    background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)",
    padding: "40px",
    borderRadius: "15px",
    textAlign: "center",
    border: "2px solid #00ffc8",
    boxShadow: "0 0 30px rgba(0, 255, 200, 0.3)",
    color: "#00ffc8",
  },
  btn: {
    background: "linear-gradient(135deg, #00ffc8 0%, #00cc99 100%)",
    color: "#0f0f1e",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    width: "100%",
    boxShadow: "0 0 15px rgba(0, 255, 200, 0.4)",
    transition: "all 0.3s",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    border: "2px solid #00ffc8",
    borderRadius: "8px",
    fontSize: "16px",
    background: "#0f0f1e",
    color: "#00ffc8",
    boxShadow: "0 0 10px rgba(0, 255, 200, 0.2)",
  },
  leaderboard: {
    background: "linear-gradient(135deg, rgba(0, 255, 200, 0.05) 0%, rgba(0, 204, 153, 0.05) 100%)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    border: "2px solid rgba(0, 255, 200, 0.2)",
    color: "#00ffc8",
    boxShadow: "0 0 15px rgba(0, 255, 200, 0.1)",
  },
  leaderboardList: {
    marginTop: "15px",
  },
  leaderboardEntry: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px",
    borderBottom: "1px solid rgba(0, 255, 200, 0.2)",
    fontSize: "14px",
    color: "#00ffc8",
    transition: "all 0.2s",
  },
  instructions: {
    textAlign: "center",
    color: "rgba(0, 255, 200, 0.7)",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "20px",
    letterSpacing: "0.5px",
  },
};
