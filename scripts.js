document.addEventListener('DOMContentLoaded', () => {
    const processInputsDiv = document.getElementById('processInputs');
    const processesInput = document.getElementById('processes');
    const algorithmSelect = document.getElementById('algorithm');
    const quantumDiv = document.getElementById('quantumDiv');
    const resultDiv = document.getElementById('result');
    const ganttChartDiv = document.getElementById('ganttChart');
    const averagesDiv = document.getElementById('averages');

    processesInput.addEventListener('input', generateProcessInputs);
    algorithmSelect.addEventListener('change', () => {
        quantumDiv.style.display = algorithmSelect.value === 'roundRobin' ? 'block' : 'none';
    });

    document.getElementById('schedulingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const processes = getProcesses();
        const algorithm = algorithmSelect.value;
        const quantum = parseInt(document.getElementById('quantum').value);
        
        if (processes.length === 0) return;

        let { ganttChart, avgTurnaroundTime, avgWaitingTime } = scheduleProcesses(processes, algorithm, quantum);

        displayResults(ganttChart, avgTurnaroundTime, avgWaitingTime);
    });

    function generateProcessInputs() {
        const numberOfProcesses = parseInt(processesInput.value);
        processInputsDiv.innerHTML = '';

        for (let i = 0; i < numberOfProcesses; i++) {
            addProcessInput(i);
        }
    }

    function addProcessInput(index) {
        processInputsDiv.innerHTML += `
            <div class="process">
                <h3>Process ${index + 1}</h3>
                <label for="arrivalTime${index}">Arrival Time:</label>
                <input type="number" id="arrivalTime${index}" class="arrivalTime" value="0" required><br>
                <label for="burstTime${index}">Burst Time:</label>
                <input type="number" id="burstTime${index}" class="burstTime" value="1" required><br>
                <label for="priority${index}" id="priorityLabel${index}">Priority:</label>
                <input type="number" id="priority${index}" class="priority" value="1" required><br>
            </div>
        `;
    }

    function getProcesses() {
        const numberOfProcesses = processInputsDiv.children.length;
        let processes = [];

        for (let i = 0; i < numberOfProcesses; i++) {
            const arrivalTime = parseInt(document.getElementById(`arrivalTime${i}`).value);
            const burstTime = parseInt(document.getElementById(`burstTime${i}`).value);
            let priority = 1; // Default value for priority
            if (algorithmSelect.value === 'priorityNP' || algorithmSelect.value === 'priorityP') {
                priority = parseInt(document.getElementById(`priority${i}`).value);
            }
            processes.push({ id: i + 1, arrivalTime, burstTime, priority });
        }

        return processes;
    }

    function scheduleProcesses(processes,algorithm, quantum) {
        // Placeholder function for scheduling
        let ganttChart = [];
        let avgTurnaroundTime = 0;
        let avgWaitingTime = 0;

        switch (algorithm) {
            case 'fcfs':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = fcfs(processes));
                break;
            case 'sjf':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = sjf(processes));
                break;
            case 'srtf':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = srtf(processes));
                break;
            case 'roundRobin':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = roundRobin(processes, quantum));
                break;
            case 'priorityNP':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = priorityNonPreemptive(processes));
                break;
            case 'priorityP':
                ({ ganttChart, avgTurnaroundTime, avgWaitingTime } = priorityPreemptive(processes));
                break;
        }

        return { ganttChart, avgTurnaroundTime, avgWaitingTime };
    }

    function displayResults(ganttChart, avgTurnaroundTime, avgWaitingTime) {
        ganttChartDiv.innerHTML = 'Gantt Chart: ' + ganttChart.map(segment => `<span>${segment}</span>`).join('');
        averagesDiv.innerHTML = `
            <p>Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)}</p>
            <p>Average Waiting Time: ${avgWaitingTime.toFixed(2)}</p>
        `;
        resultDiv.style.display = 'block';
    }

    // Placeholder scheduling algorithm implementations
    function fcfs(processes) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        let time = 0;
        let ganttChart = [];
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;

        processes.forEach(process => {
            if (time < process.arrivalTime) {
                time = process.arrivalTime;
            }
            let waitingTime = time - process.arrivalTime;
            time += process.burstTime;
            let turnaroundTime = time - process.arrivalTime;
            ganttChart.push(`P${process.id}(${turnaroundTime})`);

            totalTurnaroundTime += turnaroundTime;
            totalWaitingTime += waitingTime;
        });

        return {
            ganttChart,
            avgTurnaroundTime: totalTurnaroundTime / processes.length,
            avgWaitingTime: totalWaitingTime / processes.length
        };
    }

    function sjf(processes) {
        processes.sort((a, b) => a.burstTime - b.burstTime);
        let time = 0;
        let ganttChart = [];
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;

        processes.forEach(process => {
            if (time < process.arrivalTime) {
                time = process.arrivalTime;
            }
            let waitingTime = time - process.arrivalTime;
            time += process.burstTime;
            let turnaroundTime = time - process.arrivalTime;
            ganttChart.push(`P${process.id}(${turnaroundTime})`);

            totalTurnaroundTime += turnaroundTime;
            totalWaitingTime += waitingTime;
        });

        return {
            ganttChart,
            avgTurnaroundTime: totalTurnaroundTime / processes.length,
            avgWaitingTime: totalWaitingTime / processes.length
        };
    }

    function srtf(processes) {
        // Placeholder implementation for SRTF
        return { ganttChart: [], avgTurnaroundTime: 0, avgWaitingTime: 0 };
    }

    function roundRobin(processes, quantum) {
        // Placeholder implementation for Round Robin
        return { ganttChart: [], avgTurnaroundTime: 0, avgWaitingTime: 0 };
    }

    function priorityNonPreemptive(processes) {
        processes.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
        let time = 0;
        let ganttChart = [];
        let totalTurnaroundTime = 0;
       
        let totalWaitingTime = 0;

        processes.forEach(process => {
            if (time < process.arrivalTime) {
                time = process.arrivalTime;
            }
            let waitingTime = time - process.arrivalTime;
            time += process.burstTime;
            let turnaroundTime = time - process.arrivalTime;
            ganttChart.push(`P${process.id}(${turnaroundTime})`);

            totalTurnaroundTime += turnaroundTime;
            totalWaitingTime += waitingTime;
        });

        return {
            ganttChart,
            avgTurnaroundTime: totalTurnaroundTime / processes.length,
            avgWaitingTime: totalWaitingTime / processes.length
        };
    }

    function priorityPreemptive(processes) {
        // Placeholder implementation for preemptive priority algorithm
        return { ganttChart: [], avgTurnaroundTime: 0, avgWaitingTime: 0 };
    }
});
