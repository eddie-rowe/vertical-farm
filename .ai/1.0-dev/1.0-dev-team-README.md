# Dev Team Workflow

A comprehensive Flowise workflow that implements a complete software development lifecycle using specialized AI agents working in sequence.

## 🎯 Overview

This workflow transforms a single user request into a complete development cycle, passing work through specialized agents:

```
Human Input → Planner → Coder → Code Reviewer → Tester → Docs Updater → Summarizer → GitHub PR Creator
```

Each agent is specialized for its role, uses the same tool set (filesystem and TaskMaster), but has specific system prompts optimized for their responsibilities.

## 🏗️ Architecture

### Agent Sequence

1. **📋 Planning Agent**: Analyzes requirements, creates implementation plans, sets up TaskMaster tasks
2. **💻 Coding Agent**: Implements the planned features using filesystem tools and TaskMaster tracking
3. **🔍 Code Review Agent**: Reviews implementation for quality, security, and best practices
4. **🧪 Testing Agent**: Creates comprehensive tests and validates functionality
5. **📚 Documentation Agent**: Updates documentation, README files, and code comments
6. **📄 Summarization Agent**: Creates comprehensive project summaries and reports
7. **🚀 GitHub PR Agent**: Creates well-structured Pull Requests with all context

### Tool Integration

- **Filesystem MCP**: Provides file operations (read, write, create, delete, search)
- **TaskMaster MCP**: Enables task management, project tracking, and workflow coordination

## 📁 File Structure

```
.ai/1.0-dev/
├── multi-agent-dev-workflow.json          # Main Langflow workflow file
├── 1.0-dev-team-langflow.json            # Original single-agent workflow (for reference)
└── README-multi-agent-workflow.md        # This documentation
```

## 🚀 Setup Instructions

### Prerequisites

1. **Langflow**: Ensure Langflow is installed and running
2. **Node.js**: Required for MCP server execution
3. **OpenAI API Key**: All agents use OpenAI models (configurable)

### Installation Steps

1. **Import Workflow**:
   ```bash
   # In Langflow, import the workflow file
   multi-agent-dev-workflow.json
   ```

2. **Configure API Keys**:
   - Open each agent node in Langflow
   - Enter your OpenAI API key in the `api_key` field
   - Optionally adjust model selection (default: gpt-4o)

3. **Update File Paths**:
   - Edit the Filesystem MCP component
   - Update the command path to your project directory:
     ```
     npx -y @modelcontextprotocol/server-filesystem /path/to/your/project
     ```

4. **Initialize TaskMaster** (if not already done):
   ```bash
   cd /path/to/your/project
   npx task-master-ai init
   ```

## 💡 Usage Guide

### Basic Usage

1. **Start the Workflow**: Run the multi-agent workflow in Langflow
2. **Provide Input**: Enter your development request in the ChatInput field
3. **Monitor Progress**: Watch as each agent completes their specialized tasks
4. **Review Output**: The final agent provides a GitHub PR draft with complete context

### Input Examples

**Feature Implementation**:
```
Implement user authentication using JWT tokens. Include login, logout, and 
protected route functionality with proper error handling and validation.
```

**Bug Fix**:
```
Fix the memory leak in the data processing pipeline that occurs when handling 
large datasets. Investigate root cause and implement a robust solution.
```

**Refactoring**:
```
Refactor the legacy payment processing module to use modern async/await patterns
and improve error handling. Maintain backward compatibility.
```

### Expected Output Flow

1. **Planner Output**: Implementation plan with TaskMaster tasks created
2. **Coder Output**: Working code implementation with progress tracking
3. **Reviewer Output**: Code quality assessment and improvement suggestions
4. **Tester Output**: Comprehensive test suite and validation results
5. **Docs Output**: Updated documentation reflecting all changes
6. **Summarizer Output**: Complete project summary and change documentation
7. **GitHub PR Output**: Professional Pull Request ready for review

## ⚙️ Configuration Options

### Agent Configuration

Each agent can be individually configured:

- **Model Selection**: Choose between gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- **Max Iterations**: Adjust the maximum number of tool calls per agent (default: 15)
- **System Prompts**: Customize agent behavior by modifying system prompts

### Tool Configuration

**Filesystem MCP**:
- Update project path in command field
- Adjust environment variables if needed

**TaskMaster MCP**:
- Ensure TaskMaster is initialized in your project
- Configure project settings in `.taskmasterconfig`

## 🔧 Customization

### Adding New Agents

To add additional agents to the workflow:

1. **Create Agent Node**: Add new agent with specialized system prompt
2. **Update Edges**: Connect the new agent in the sequence
3. **Position Node**: Place appropriately in the visual workflow
4. **Connect Tools**: Ensure access to filesystem and TaskMaster tools

### Modifying Agent Roles

Edit system prompts to adjust agent behavior:

```json
{
  "system_prompt": {
    "value": "Your custom agent instructions here..."
  }
}
```

### Tool Integration

Add additional MCP tools by:
1. Creating new MCPTools nodes
2. Connecting them to relevant agents
3. Updating agent prompts to utilize new capabilities

## 🐛 Troubleshooting

### Common Issues

**Agent Failures**:
- Check API key configuration
- Verify model availability
- Review system prompt formatting

**Tool Connection Issues**:
- Ensure Node.js is installed
- Verify project paths in MCP commands
- Check TaskMaster initialization

**Workflow Interruptions**:
- Monitor agent iteration limits
- Check for error messages in Langflow logs
- Verify tool permissions and access

### Debug Mode

Enable debug mode by:
1. Adding environment variables to MCP tools
2. Using verbose logging in agents
3. Monitoring tool execution results

## 📊 Performance Considerations

### Optimization Tips

- **Model Selection**: Use gpt-4o-mini for faster, cost-effective processing
- **Iteration Limits**: Adjust max_iterations based on task complexity
- **Tool Efficiency**: Monitor filesystem and TaskMaster tool usage

### Resource Usage

- **Token Consumption**: Each agent consumes tokens based on context and iterations
- **Execution Time**: Complete workflow can take 10-30 minutes depending on complexity
- **API Costs**: Monitor OpenAI API usage across all agents

## 🔒 Security Considerations

- **API Keys**: Store securely, never commit to version control
- **File Access**: Filesystem MCP respects configured directory boundaries
- **Tool Permissions**: Review MCP tool capabilities and restrictions

## 🤝 Contributing

To improve this workflow:

1. **Test Scenarios**: Try different types of development requests
2. **Agent Optimization**: Refine system prompts for better results
3. **Tool Integration**: Add new MCP capabilities as needed
4. **Documentation**: Update this README with new findings

## 📋 Workflow Comparison

| Feature | Single Agent | Multi-Agent |
|---------|--------------|-------------|
| Specialization | General purpose | Role-specific expertise |
| Quality Control | Single review | Multi-stage validation |
| Documentation | Basic | Comprehensive |
| Testing | Optional | Built-in requirement |
| PR Quality | Standard | Professional with context |
| Tracking | Basic | Full TaskMaster integration |

## 🎯 Best Practices

1. **Clear Input**: Provide detailed, specific development requests
2. **Monitor Progress**: Watch agent outputs for early issue detection
3. **Review Results**: Validate each agent's output before proceeding
4. **Customize Prompts**: Adjust system prompts based on your team's needs
5. **Tool Hygiene**: Keep TaskMaster and filesystem tools well-organized

## 📈 Future Enhancements

Planned improvements:
- **Parallel Processing**: Enable concurrent execution where possible
- **Error Recovery**: Implement retry mechanisms for failed agents
- **Custom Tools**: Add project-specific MCP tools
- **Quality Metrics**: Implement automated quality scoring
- **Integration**: Connect with external CI/CD systems

---

**Note**: This workflow is designed for comprehensive development tasks. For simple changes, consider using the original single-agent workflow for faster execution. 