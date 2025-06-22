'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Users,
  Activity,
  Zap,
  Shield,
  Bot,
  Database,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';

/**
 * MASTER ADMIN CRM DASHBOARD
 * 
 * Your master portal for managing the entire Zenith business
 * Uses master login credentials for full access
 * 
 * Features:
 * - Live Financial Tracking (Input/Output/Profit)
 * - Platform Health Monitoring  
 * - Agent Workforce Status
 * - Truth Agent Integration
 * - Real-time Business Metrics
 */

interface LiveFinancials {
  inputCash: number;           // Monthly Recurring Revenue
  outputCosts: number;         // API + Cloud costs
  liveProfitMargin: number;    // Real-time profit
  newRevenue: number;          // One-off build fees
}

interface PlatformHealth {
  totalActiveUsers: number;
  averageHealthScore: number;
  systemUptime: number;
  activeAgents: number;
}

interface AgentWorkforceStatus {
  totalMissions: number;
  inProgress: number;
  completed: number;
  failed: number;
  agents: {
    name: string;
    status: 'ACTIVE' | 'IDLE' | 'ERROR';
    currentTask?: string;
    lastActivity: string;
  }[];
}

export default function MasterAdminDashboard() {
  const [financials, setFinancials] = useState<LiveFinancials>({
    inputCash: 0,
    outputCosts: 0,
    liveProfitMargin: 0,
    newRevenue: 0
  });

  const [platformHealth, setPlatformHealth] = useState<PlatformHealth>({
    totalActiveUsers: 0,
    averageHealthScore: 0,
    systemUptime: 0,
    activeAgents: 0
  });

  const [agentStatus, setAgentStatus] = useState<AgentWorkforceStatus>({
    totalMissions: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    agents: []
  });

  const [truthAssessment, setTruthAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Real-time data fetching
  useEffect(() => {
    fetchDashboardData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch live financials
      const financialResponse = await fetch('/api/admin/financials', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MASTER_TOKEN}`
        }
      });
      if (financialResponse.ok) {
        const data = await financialResponse.json();
        setFinancials(data);
      }

      // Fetch platform health
      const healthResponse = await fetch('/api/admin/platform-health', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MASTER_TOKEN}`
        }
      });
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        setPlatformHealth(data);
      }

      // Fetch agent workforce status
      const agentResponse = await fetch('/api/admin/agent-status', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MASTER_TOKEN}`
        }
      });
      if (agentResponse.ok) {
        const data = await agentResponse.json();
        setAgentStatus(data);
      }

      // Fetch truth assessment
      const truthResponse = await fetch('/api/admin/truth-assessment', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MASTER_TOKEN}`
        }
      });
      if (truthResponse.ok) {
        const data = await truthResponse.json();
        setTruthAssessment(data.assessment);
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Master Admin CRM
        </h1>
        <p className="text-gray-400 mt-2">
          Complete business oversight and agent workforce management
        </p>
      </div>

      {/* Live Financials Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-xl bg-green-500/10 border border-green-500/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
              INPUT
            </span>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">
            {formatCurrency(financials.inputCash)}
          </div>
          <div className="text-sm text-gray-400">Monthly Recurring Revenue</div>
          <div className="text-xs text-green-400 mt-2">
            +{formatCurrency(financials.newRevenue)} new revenue
          </div>
        </div>

        <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-red-400" />
            <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full">
              OUTPUT
            </span>
          </div>
          <div className="text-3xl font-bold text-red-400 mb-2">
            {formatCurrency(financials.outputCosts)}
          </div>
          <div className="text-sm text-gray-400">API + Cloud Costs</div>
        </div>

        <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
              PROFIT
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {formatCurrency(financials.liveProfitMargin)}
          </div>
          <div className="text-sm text-gray-400">Live Profit Margin</div>
          <div className="text-xs text-blue-400 mt-2">
            {((financials.liveProfitMargin / financials.inputCash) * 100).toFixed(1)}% margin
          </div>
        </div>

        <div className="backdrop-blur-xl bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-400" />
            <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
              USERS
            </span>
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {platformHealth.totalActiveUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Active Users</div>
        </div>
      </div>

      {/* Platform Health & Truth Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-400" />
            Platform Health
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">System Uptime</span>
              <span className="text-green-400 font-bold">
                {platformHealth.systemUptime.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Health Score</span>
              <span className="text-blue-400 font-bold">
                {platformHealth.averageHealthScore}/100
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Agents</span>
              <span className="text-purple-400 font-bold">
                {platformHealth.activeAgents}
              </span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Truth Assessment
          </h3>
          
          {truthAssessment ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Honest Score</span>
                <span className={`font-bold ${
                  truthAssessment.overallScore >= 80 ? 'text-green-400' :
                  truthAssessment.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {truthAssessment.overallScore}/100
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Build Ready</span>
                {truthAssessment.buildReady ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Critical Issues</span>
                <span className="text-red-400 font-bold">
                  {truthAssessment.issues.filter((i: any) => i.severity === 'CRITICAL').length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Deployment Risk</span>
                <span className={`font-bold ${
                  truthAssessment.deploymentRisk === 'LOW' ? 'text-green-400' :
                  truthAssessment.deploymentRisk === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {truthAssessment.deploymentRisk}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Loading truth assessment...</div>
          )}
        </div>
      </div>

      {/* Agent Workforce Status */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Bot className="w-6 h-6 text-cyan-400" />
          Agent Workforce Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{agentStatus.totalMissions}</div>
            <div className="text-sm text-gray-400">Total Missions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{agentStatus.inProgress}</div>
            <div className="text-sm text-gray-400">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{agentStatus.completed}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{agentStatus.failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </div>
        </div>

        {/* Active Agents List */}
        <div className="space-y-3">
          {agentStatus.agents.map((agent, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  agent.status === 'ACTIVE' ? 'bg-green-400' :
                  agent.status === 'IDLE' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <span className="font-medium">{agent.name}</span>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {agent.currentTask || 'Idle'}
                </div>
                <div className="text-xs text-gray-500">
                  {agent.lastActivity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => window.open('/api/admin/truth-assessment', '_blank')}
          className="backdrop-blur-xl bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 hover:bg-purple-500/20 transition-all"
        >
          <Zap className="w-6 h-6 text-purple-400 mb-2" />
          <div className="font-medium">Force Truth Assessment</div>
          <div className="text-xs text-gray-400">Run immediate system check</div>
        </button>
        
        <button className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 hover:bg-blue-500/20 transition-all">
          <Database className="w-6 h-6 text-blue-400 mb-2" />
          <div className="font-medium">Database Status</div>
          <div className="text-xs text-gray-400">Check DB health</div>
        </button>
        
        <button className="backdrop-blur-xl bg-green-500/10 border border-green-500/20 rounded-xl p-4 hover:bg-green-500/20 transition-all">
          <Clock className="w-6 h-6 text-green-400 mb-2" />
          <div className="font-medium">Agent Logs</div>
          <div className="text-xs text-gray-400">View agent activity</div>
        </button>
      </div>
    </div>
  );
}
