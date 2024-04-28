import {createEffect} from "solid-js";

const Graph = (props) => {

    let graphRef
    let canvasRef
    const getTime = mult => Math.log(mult) / 0.00006;

    createEffect(() => {
        resizeCanvas()
        window.addEventListener('resize', screenSizeChange)
        return () => window.removeEventListener('resize', screenSizeChange)
    })

    function screenSizeChange() {
        let ctx = graphRef?.getContext('2d')
        let multi = props?.payout
        let timeElapsed = getTime(multi)
        let values = getValues(timeElapsed, multi)

        resizeCanvas()
        clearGraph(ctx)
        drawAxes(ctx, multi, values)
        drawGraph(ctx, multi, values)
    }

    function resizeCanvas() {
        let ctx = graphRef?.getContext('2d')

        if (ctx) {
            graphRef.height = canvasRef.clientHeight
            graphRef.width = canvasRef.clientWidth
        }
    }

    createEffect(() => {
        if (props?.payout) {
            let ctx = graphRef?.getContext('2d')
            if (!ctx) return

            let multi = props?.payout
            let timeElapsed = getTime(multi)
            let values = getValues(timeElapsed, multi)

            clearGraph(ctx)
            drawAxes(ctx, multi, values)
            drawGraph(ctx, multi, values)
        }
    })

    function getValues(time, multi) {
        let yAxisMin = 2
        let xStart = 20
        let yStart = 20
        let xEnd = 80
        let yEnd = 80
        let yAxisValue = 2
        let xAxisValue = 10000 // 10 seconds
        let canvasHeight = canvasRef.clientHeight
        let canvasWidth = canvasRef.clientWidth
        let plotHeight = canvasHeight - yStart
        let plotWidth = canvasWidth - xStart

        if (time > xAxisValue)
            xAxisValue = time

        if (multi > yAxisValue)
            yAxisValue = multi

        yAxisValue -= 1
        let widthIncrement = canvasRef.clientWidth / xAxisValue
        let heightIncrement = canvasRef.clientHeight / yAxisValue
        let currentX = time * widthIncrement

        return {
            xEnd,
            yEnd,
            xStart,
            yStart,
            canvasHeight,
            canvasWidth,
            yAxisValue,
            xAxisValue,
            plotHeight,
            plotWidth,
            widthIncrement,
            heightIncrement,
            currentX
        }
    }

    function drawGraph(ctx, multi, values) {
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 3
        ctx.beginPath();

        for (let m = 1; m < multi; m += 0.01) {
            let t = getTime(m)
            let adjustedM = m - 1

            let y = values.canvasHeight - (adjustedM * values.heightIncrement) - values.yStart
            let x = t * values.widthIncrement
            ctx.setLineDash([])
            ctx.lineTo(x, y)
        }

        ctx.stroke();
    }

    function drawAxes(ctx, multi, values) {
        function stepValues(x) {
            var c = .4;
            var r = .1;
            while (true) {

                if (x <  c) return r;

                c *= 5;
                r *= 2;

                if (x <  c) return r;
                c *= 2;
                r *= 5;
            }
        }

        let payoutSeparation = stepValues(multi);

        ctx.lineWidth=1;
        ctx.strokeStyle = 'white';
        ctx.font= "normal normal bold 13px Geogrotesque Wide";
        ctx.fillStyle = 'white';

        for(let payout = payoutSeparation, i = 0; payout < values.yAxisValue; payout += payoutSeparation, i++) {
            let y = values.plotHeight - (payout*values.heightIncrement);
            let text = (payout + 1).toFixed(2) + 'x'
            let textWidth = ctx.measureText(text).width;

            ctx.fillText(text, values.plotWidth - textWidth, y - 5);

            ctx.beginPath();
            ctx.moveTo(values.plotWidth, y);
            ctx.setLineDash([20, 10])
            ctx.lineTo(20, y);
            ctx.strokeStyle = '#291114'
            ctx.stroke();

            if(i > 100) break
        }

        //Calculate X Axis
        let milisecondsSeparation = stepValues(values.xAxisValue);
        let XAxisValuesSeparation = values.plotWidth / (values.xAxisValue/milisecondsSeparation);

        //Draw X Axis Values
        for(var miliseconds = 0, counter = 0, i = 0; miliseconds < values.xAxisValue; miliseconds+=milisecondsSeparation, counter++, i++) {
            let seconds = miliseconds/1000;
            let textWidth = ctx.measureText(seconds).width;
            let x = (counter*XAxisValuesSeparation) + values.xStart
            ctx.fillText(seconds + 's', x - textWidth/2, values.plotHeight + 11);

            if(i > 100) break
        }

        //Draw background Axis
        ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, values.canvasHeight);
        ctx.lineTo(0, values.canvasHeight);
        ctx.stroke();
    }

    function clearGraph(ctx) {
        ctx.clearRect(0, 0, graphRef?.width, graphRef?.height);
    }

    return (
        <>
            <div ref={canvasRef} class='canvas'>
                <canvas ref={graphRef}></canvas>
            </div>

            <style jsx>{`
              .canvas {
                top: 0;
                left: 0;
                z-index: 1;
                position: absolute;
                display: flex;
                height: 100%;
                width: 100%;
              }
            `}</style>
        </>
    )
}

export default Graph;