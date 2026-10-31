import assert from "node:assert/strict";

// Helper simulating store reducer functions
function createStore(initialState) {
    let state = {
        tasks: [],
        selectedTaskId: null,
        ...initialState,
    };

    const set = (updater) => {
        const patch = typeof updater === "function" ? updater(state) : updater;
        state = { ...state, ...patch };
    };

    const actions = {
        toggleTask: (id) =>
            set((state) => {
                let shouldClearSelected = false;
                const tasks = (state.tasks || []).map((task) => {
                    if (task.id !== id) return task;
                    const nextCompleted = !task.completed;
                    if (nextCompleted && state.selectedTaskId === id) {
                        shouldClearSelected = true;
                    }
                    return {
                        ...task,
                        completed: nextCompleted,
                        completedAt: nextCompleted
                            ? (task.completedAt || new Date().toISOString())
                            : undefined,
                        subtasks: (task.subtasks || []).map((sub) => ({
                            ...sub,
                            completed: nextCompleted,
                        })),
                    };
                });
                return {
                    tasks,
                    selectedTaskId: shouldClearSelected ? null : state.selectedTaskId,
                };
            }),

        toggleSubtask: (taskId, subtaskId) =>
            set((state) => {
                let shouldClearSelected = false;
                const tasks = (state.tasks || []).map((task) => {
                    if (task.id !== taskId) return task;
                    const subtasks = (task.subtasks || []).map((sub) =>
                        sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub,
                    );
                    const allCompleted = subtasks.length > 0 && subtasks.every((sub) => sub.completed);
                    if (allCompleted && state.selectedTaskId === taskId) {
                        shouldClearSelected = true;
                    }
                    return {
                        ...task,
                        completed: allCompleted,
                        completedAt: allCompleted
                            ? (task.completed ? task.completedAt : new Date().toISOString())
                            : undefined,
                        subtasks,
                    };
                });
                return {
                    tasks,
                    selectedTaskId: shouldClearSelected ? null : state.selectedTaskId,
                };
            }),

        deleteSubtask: (taskId, subtaskId) =>
            set((state) => {
                let shouldClearSelected = false;
                const tasks = (state.tasks || []).map((task) => {
                    if (task.id !== taskId) return task;
                    const subtasks = (task.subtasks || []).filter((sub) => sub.id !== subtaskId);
                    if (subtasks.length === 0) {
                        return { ...task, subtasks };
                    }
                    const allCompleted = subtasks.every((sub) => sub.completed);
                    if (allCompleted && state.selectedTaskId === taskId) {
                        shouldClearSelected = true;
                    }
                    return {
                        ...task,
                        completed: allCompleted,
                        completedAt: allCompleted
                            ? (task.completed ? task.completedAt : new Date().toISOString())
                            : undefined,
                        subtasks,
                    };
                });
                return {
                    tasks,
                    selectedTaskId: shouldClearSelected ? null : state.selectedTaskId,
                };
            }),

        deleteTask: (id) =>
            set((state) => ({
                tasks: (state.tasks || []).filter((task) => task.id !== id),
                selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
            })),
    };

    return {
        getState: () => state,
        actions,
    };
}

// Test 1: Checking parent task marks all subtasks complete and clears selectedTaskId
{
    const store = createStore({
        selectedTaskId: "task-1",
        tasks: [
            {
                id: "task-1",
                text: "Parent Task",
                completed: false,
                subtasks: [
                    { id: "sub-1", text: "Sub 1", completed: false },
                    { id: "sub-2", text: "Sub 2", completed: true },
                ],
            },
        ],
    });

    store.actions.toggleTask("task-1");
    const state = store.getState();
    assert.equal(state.tasks[0].completed, true);
    assert.equal(state.tasks[0].subtasks[0].completed, true);
    assert.equal(state.tasks[0].subtasks[1].completed, true);
    assert.equal(state.selectedTaskId, null, "selectedTaskId must be cleared when active task completed");
}

// Test 2: Unchecking parent task marks all subtasks incomplete
{
    const store = createStore({
        selectedTaskId: null,
        tasks: [
            {
                id: "task-1",
                text: "Parent Task",
                completed: true,
                subtasks: [
                    { id: "sub-1", text: "Sub 1", completed: true },
                    { id: "sub-2", text: "Sub 2", completed: true },
                ],
            },
        ],
    });

    store.actions.toggleTask("task-1");
    const state = store.getState();
    assert.equal(state.tasks[0].completed, false);
    assert.equal(state.tasks[0].subtasks[0].completed, false);
    assert.equal(state.tasks[0].subtasks[1].completed, false);
}

// Test 3: Checking all subtasks marks parent complete and clears selectedTaskId
{
    const store = createStore({
        selectedTaskId: "task-1",
        tasks: [
            {
                id: "task-1",
                text: "Parent Task",
                completed: false,
                subtasks: [
                    { id: "sub-1", text: "Sub 1", completed: true },
                    { id: "sub-2", text: "Sub 2", completed: false },
                ],
            },
        ],
    });

    store.actions.toggleSubtask("task-1", "sub-2");
    const state = store.getState();
    assert.equal(state.tasks[0].completed, true);
    assert.equal(state.tasks[0].subtasks[1].completed, true);
    assert.equal(state.selectedTaskId, null, "selectedTaskId must be cleared when all subtasks completed");
}

// Test 4: Unchecking one subtask leaves parent incomplete
{
    const store = createStore({
        selectedTaskId: null,
        tasks: [
            {
                id: "task-1",
                text: "Parent Task",
                completed: true,
                subtasks: [
                    { id: "sub-1", text: "Sub 1", completed: true },
                    { id: "sub-2", text: "Sub 2", completed: true },
                ],
            },
        ],
    });

    store.actions.toggleSubtask("task-1", "sub-1");
    const state = store.getState();
    assert.equal(state.tasks[0].completed, false);
    assert.equal(state.tasks[0].subtasks[0].completed, false);
    assert.equal(state.tasks[0].subtasks[1].completed, true);
}

// Test 5: Deleting incomplete subtask when remaining are completed marks parent complete
{
    const store = createStore({
        selectedTaskId: "task-1",
        tasks: [
            {
                id: "task-1",
                text: "Parent Task",
                completed: false,
                subtasks: [
                    { id: "sub-1", text: "Sub 1", completed: true },
                    { id: "sub-2", text: "Sub 2", completed: false },
                ],
            },
        ],
    });

    store.actions.deleteSubtask("task-1", "sub-2");
    const state = store.getState();
    assert.equal(state.tasks[0].completed, true);
    assert.equal(state.tasks[0].subtasks.length, 1);
    assert.equal(state.selectedTaskId, null);
}

// Test 6: Deleting task removes task and clears selectedTaskId
{
    const store = createStore({
        selectedTaskId: "task-1",
        tasks: [
            {
                id: "task-1",
                text: "Parent Task",
                completed: false,
                subtasks: [],
            },
        ],
    });

    store.actions.deleteTask("task-1");
    const state = store.getState();
    assert.equal(state.tasks.length, 0);
    assert.equal(state.selectedTaskId, null);
}

console.log("All task and subtask sync assertions passed.");
