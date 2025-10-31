#include <iostream>
#include <vector>
#include <chrono>   // For std::chrono
#include <thread>   // For std::this_thread::sleep_for

// Define the "world" for our agent
class Environment {
public:
    // Initialize the grid with a simple layout
    Environment() : grid({
        {'#', '#', '#', '#', '#', '#', '#', '#', '#', '#'},
        {'#', 'A', ' ', ' ', '#', ' ', ' ', ' ', ' ', '#'},
        {'#', ' ', '#', ' ', '#', ' ', '#', '#', ' ', '#'},
        {'#', ' ', '#', ' ', ' ', ' ', ' ', ' ', ' ', '#'},
        {'#', ' ', '#', '#', '#', '#', ' ', '#', 'G', '#'},
        {'#', ' ', ' ', ' ', ' ', '#', ' ', ' ', ' ', '#'},
        {'#', '#', '#', '#', '#', '#', '#', '#', '#', '#'}
    }) {
        // Find the initial agent and goal positions
        for (int i = 0; i < grid.size(); ++i) {
            for (int j = 0; j < grid[i].size(); ++j) {
                if (grid[i][j] == 'A') {
                    agentX = i;
                    agentY = j;
                } else if (grid[i][j] == 'G') {
                    goalX = i;
                    goalY = j;
                }
            }
        }
    }

    // A function to print the current state of the world
    void print() const {
        // Clear the console (a simple platform-dependent way)
        #ifdef _WIN32
        std::system("cls");
        #else
        std::system("clear");
        #endif

        for (const auto& row : grid) {
            for (char cell : row) {
                std::cout << cell << ' ';
            }
            std::cout << std::endl;
        }
        std::cout << "--------------------" << std::endl;
    }

    // A function to check if a move is valid (not a wall '#')
    bool isValid(int x, int y) const {
        if (x < 0 || x >= grid.size() || y < 0 || y >= grid[0].size()) {
            return false;
        }
        return grid[x][y] != '#';
    }

    // Update the grid with the agent's new position
    void updateAgentPosition(int oldX, int oldY, int newX, int newY) {
        if (isValid(newX, newY)) {
            grid[oldX][oldY] = ' '; // Clear old position
            grid[newX][newY] = 'A'; // Set new position
            agentX = newX;
            agentY = newY;
        }
    }

    // Getters for agent and goal positions
    int getAgentX() const { return agentX; }
    int getAgentY() const { return agentY; }
    int getGoalX() const { return goalX; }
    int getGoalY() const { return goalY; }

private:
    std::vector<std::vector<char>> grid;
    int agentX, agentY;
    int goalX, goalY;
};

// Define the Agent
class Agent {
public:
    // The "Perceive" step: The agent gets information from the environment
    // In this simple case, it just finds out where it is and where the goal is.
    void perceive(const Environment& env) {
        currentX = env.getAgentX();
        currentY = env.getAgentY();
        goalX = env.getGoalX();
        goalY = env.getGoalY();
    }

    // The "Decide" step: The agent uses its perceived information to make a choice.
    // This is the "AI" logic. Here, it's just a simple rule-based system.
    void decide() {
        // Reset planned moves
        nextX = currentX;
        nextY = currentY;

        // Simple greedy logic: move towards the goal
        if (goalX > currentX) {
            nextX = currentX + 1; // Plan to move down
        } else if (goalX < currentX) {
            nextX = currentX - 1; // Plan to move up
        } else if (goalY > currentY) {
            nextY = currentY + 1; // Plan to move right
        } else if (goalY < currentY) {
            nextY = currentY - 1; // Plan to move left
        }
    }

    // The "Act" step: The agent performs its chosen action on the environment.
    void act(Environment& env) {
        if (env.isValid(nextX, nextY)) {
            env.updateAgentPosition(currentX, currentY, nextX, nextY);
        } else {
            // If the planned move is invalid (a wall), try to find an alternative
            // This is a very simple obstacle avoidance logic
            if (goalY > currentY && env.isValid(currentX, currentY + 1)) {
                env.updateAgentPosition(currentX, currentY, currentX, currentY + 1);
            } else if (goalY < currentY && env.isValid(currentX, currentY - 1)) {
                env.updateAgentPosition(currentX, currentY, currentX, currentY - 1);
            } else if (goalX > currentX && env.isValid(currentX + 1, currentY)) {
                env.updateAgentPosition(currentX, currentY, currentX + 1, currentY);
            } else if (goalX < currentX && env.isValid(currentX - 1, currentY)) {
                env.updateAgentPosition(currentX, currentY, currentX - 1, currentY);
            }
        }
    }

    // Check if the agent has reached the goal
    bool hasReachedGoal() const {
        return currentX == goalX && currentY == goalY;
    }

private:
    int currentX, currentY; // Perceived current position
    int goalX, goalY;       // Perceived goal position
    int nextX, nextY;       // Planned next move
};

// The main simulation loop
int main() {
    Environment env;
    Agent agent;

    int maxSteps = 100; // Safety break to prevent infinite loops
    int steps = 0;

    // Run the simulation until the goal is reached or max steps exceeded
    while (!agent.hasReachedGoal() && steps < maxSteps) {
        // 1. Print the current state
        env.print();
        std::cout << "Step: " << steps << std::endl;
        std::cout << "Agent at (" << env.getAgentX() << ", " << env.getAgentY() << ")" << std::endl;
        std::cout << "Goal at (" << env.getGoalX() << ", " << env.getGoalY() << ")" << std::endl;

        // 2. Agent's turn (Perceive, Decide, Act)
        agent.perceive(env);
        agent.decide();
        agent.act(env);

        // 3. Increment step counter
        steps++;

        // 4. Pause for a short time so we can watch the agent move
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
    }

    // Final print to show the result
    env.print();
    if (agent.hasReachedGoal()) {
        std::cout << "Goal reached in " << steps << " steps!" << std::endl;
    } else {
        std::cout << "Agent could not reach the goal." << std::endl;
    }

    return 0;
}
