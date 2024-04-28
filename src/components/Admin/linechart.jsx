import { createEffect, createSignal, onCleanup } from "solid-js";

function LineChart(props) {
    let canvas;
    const [hoveredPoint, setHoveredPoint] = createSignal(null);

    function calculateMaxPlayers() {
        return Math.max(...props.data.map(point => point.players));
    }

    const drawChart = (canvas) => {
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const paddingTop = 10;
        const paddingLeft = 10;
        const paddingRight = 10;

        const chartWidth = canvas.width - paddingLeft - paddingRight;
        const chartHeight = canvas.height - paddingTop;

        const maxPlayers = calculateMaxPlayers();

        // Fill for area under the graph
        ctx.fillStyle = "rgba(60, 50, 126, 0.35)";
        ctx.beginPath();

        // Loop through the data and draw lines and fill
        if (props?.data.length > 0) {
            const firstPoint = props?.data[0];

            const firstX = paddingLeft;
            const firstY = paddingTop + (1 - firstPoint.players / maxPlayers) * chartHeight;

            ctx.moveTo(firstX, firstY);

            for (let i = 1; i < props?.data.length; i++) {
                const point = props?.data[i];
                const x = paddingLeft + (i / (props?.data.length - 1)) * chartWidth;
                const y = paddingTop + (1 - point.players / maxPlayers) * chartHeight;

                // Draw lines to subsequent points
                ctx.lineTo(x, y);
            }
        }

        // Add points to the fill path
        ctx.lineTo(paddingLeft + chartWidth, paddingTop + chartHeight);
        ctx.lineTo(paddingLeft, paddingTop + chartHeight);

        // Complete the fill path
        ctx.closePath();
        ctx.fill();

        // Draw lines between data points
        ctx.strokeStyle = "#6155A1";

        ctx.beginPath();
        for (let i = 0; i < props?.data.length; i++) {
            const point = props?.data[i];
            const x = paddingLeft + (i / (props?.data.length - 1)) * chartWidth;
            const y = paddingTop + (1 - point.players / maxPlayers) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Add gridlines along the X and Y axes
        ctx.strokeStyle = "rgba(67, 61, 107, 0.75)"; // Color for gridlines
        ctx.lineWidth = 1;

        // Draw vertical gridlines along the X-axis
        for (let i = 1; i < props?.data.length - 1; i++) {
            const x = paddingLeft + (i / (props?.data.length - 1)) * chartWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, paddingTop + chartHeight);
            ctx.stroke();
        }

        // Draw horizontal gridlines along the Y-axis based on maxYValue
        const lines = Math.min(5, maxPlayers)
        for (let i = 1; i <= lines; i++) {
            const y = paddingTop + (1 - i / lines) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y); // Use canvas.width as the ending point
            ctx.stroke();
        }

        // Draw circles at data points filled with #6155A1
        ctx.fillStyle = "white";

        for (let i = 0; i < props?.data.length; i++) {
            const point = props?.data[i];
            const x = paddingLeft + (i / (props?.data.length - 1)) * chartWidth;
            const y = paddingTop + (1 - point.players / maxPlayers) * chartHeight;

            // Draw circles at data points
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Add event listener for hover
        canvas.addEventListener("mousemove", handleMouseMove);

        function handleMouseMove(event) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Find the closest data point to the mouse position
            let closestPoint = null;

            for (let i = 0; i < props?.data.length; i++) {
                const point = props?.data[i];
                const x = paddingLeft + (i / (props?.data.length - 1)) * chartWidth;
                const y = paddingTop + (1 - point.players / maxPlayers) * chartHeight;

                const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);

                if (distance < 4) {
                    closestPoint = { ...point, x }
                    break
                }
            }

            setHoveredPoint(closestPoint);
        }
    };


    createEffect(() => {
        const parent = canvas.parentElement;
        window.addEventListener("resize", handleResize);

        // Use a setTimeout to ensure canvas dimensions are set after DOM update
        setTimeout(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;

            if (props?.data) {
                drawChart(canvas);
            }
        }, 0);
    });

    // Function to update the canvas size
    const handleResize = () => {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        drawChart(canvas)
    };

    onCleanup(() => {
        window.removeEventListener("resize", handleResize);
    });

    return (
        <>
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <canvas
                    ref={(canvasRef) => (canvas = canvasRef)}
                    style={{ width: "100%", height: "100%" }}
                />

                {hoveredPoint() && (
                    <div
                        class='tooltip'
                        style={{
                            position: "absolute",
                            top: (1 - hoveredPoint().players / calculateMaxPlayers()) * 100 + "%",
                            left: `calc(${hoveredPoint().x}px - 120px)`,
                            transform: "translateY(-100px)", // Adjust the Y position and center horizontally
                        }}
                    >
                        <p>{hoveredPoint().from} - {hoveredPoint().to}</p>
                        <p>{hoveredPoint().players} Players</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .tooltip {
                  text-align: center;

                  border-radius: 7px;
                  background: #231F43;

                  width: 240px;
                  max-width: 240px;
                  height: 90px;

                  color: #ADA3EF;
                  font-family: Geogrotesque Wide, sans-serif;
                  font-size: 16px;
                  font-weight: 500;
                  
                  padding: 10px 15px;
                }
            `}</style>
        </>
    );
}

export default LineChart;