import { useState } from "react";

const BUTTONS = [
  ["AC", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

export function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const inputDigit = (d: string) => {
    if (waiting) { setDisplay(d); setWaiting(false); }
    else setDisplay(display === "0" ? d : display + d);
  };
  const inputDot = () => {
    if (waiting) { setDisplay("0."); setWaiting(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };
  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setWaiting(false); };
  const negate = () => setDisplay(display.startsWith("-") ? display.slice(1) : display === "0" ? "0" : "-" + display);
  const percent = () => setDisplay(String(parseFloat(display) / 100));

  const compute = (a: number, b: number, o: string) => {
    switch (o) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const applyOp = (nextOp: string) => {
    const value = parseFloat(display);
    if (prev == null) setPrev(value);
    else if (op) {
      const r = compute(prev, value, op);
      setPrev(r);
      setDisplay(String(r));
    }
    setOp(nextOp);
    setWaiting(true);
  };

  const equals = () => {
    const value = parseFloat(display);
    if (op != null && prev != null) {
      const r = compute(prev, value, op);
      setDisplay(String(r));
      setPrev(null);
      setOp(null);
      setWaiting(true);
    }
  };

  const press = (b: string) => {
    if (/[0-9]/.test(b)) inputDigit(b);
    else if (b === ".") inputDot();
    else if (b === "AC") clear();
    else if (b === "±") negate();
    else if (b === "%") percent();
    else if (b === "=") equals();
    else applyOp(b);
  };

  return (
    <div className="h-full flex flex-col p-3 bg-transparent">
      <div className="flex-1 flex items-end justify-end pb-4 pr-2 text-5xl font-light tabular-nums overflow-hidden">
        <span className="truncate">{display}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {BUTTONS.flat().map((b) => {
          const isOp = ["÷", "×", "−", "+", "="].includes(b);
          const isFn = ["AC", "±", "%"].includes(b);
          const wide = b === "0";
          return (
            <button
              key={b}
              onClick={() => press(b)}
              className={`h-14 rounded-2xl text-lg font-medium transition active:brightness-125 ${
                wide ? "col-span-2" : ""
              } ${
                isOp ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg"
                : isFn ? "glass-strong"
                : "glass"
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>
    </div>
  );
}
