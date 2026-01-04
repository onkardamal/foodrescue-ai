import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { UserStats, FoodItem } from '../types';
import { Leaf, DollarSign, TrendingUp, Award, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  stats: UserStats;
  inventory: FoodItem[];
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Green, Amber, Red

const Dashboard: React.FC<DashboardProps> = ({ stats, inventory }) => {
  
  // Calculate inventory status for charts
  const activeItems = inventory.filter(i => i.status === 'active').length;
  const donatedItems = inventory.filter(i => i.status === 'donated').length;
  const wastedItems = inventory.filter(i => i.status === 'wasted').length;

  const pieData = [
    { name: 'Active', value: activeItems },
    { name: 'Donated', value: donatedItems },
    { name: 'Wasted', value: wastedItems },
  ];

  // Mock Activity Data
  const activityData = [
    { name: 'M', saved: 2, waste: 0 },
    { name: 'T', saved: 3, waste: 1 },
    { name: 'W', saved: 5, waste: 0 },
    { name: 'T', saved: 1, waste: 0 },
    { name: 'F', saved: 4, waste: 1 },
    { name: 'S', saved: 6, waste: 0 },
    { name: 'S', saved: 3, waste: 0 },
  ];

  const StatCard = ({ icon: Icon, label, value, colorClass, bgClass, subValue }: any) => (
      <div className={`${bgClass} p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow`}>
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 scale-150">
             <Icon size={100} className={colorClass} />
          </div>
          <div className="relative z-10">
            <div className={`flex items-center gap-2 ${colorClass} mb-3`}>
                <Icon size={20} />
                <span className="text-sm font-bold uppercase tracking-wider opacity-90">{label}</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-800">{value}</p>
            {subValue && <p className="text-xs text-slate-500 mt-1 font-medium">{subValue}</p>}
          </div>
      </div>
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center px-1">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Hello, Chef!</h2>
            <p className="text-slate-500">Let's save some food today.</p>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-emerald-200 flex items-center gap-2">
          <Award size={18} className="fill-white" /> Level {stats.level}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
            icon={Leaf} 
            label="Meals Saved" 
            value={stats.mealsSaved} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50/50"
            subValue="≈ 12kg Food"
        />
        <StatCard 
            icon={DollarSign} 
            label="Money Saved" 
            value={`$${stats.moneySaved}`} 
            colorClass="text-amber-600" 
            bgClass="bg-amber-50/50"
            subValue="This Month"
        />
        <StatCard 
            icon={TrendingUp} 
            label="CO2 Prevented" 
            value={`${stats.co2Saved}kg`} 
            colorClass="text-blue-600" 
            bgClass="bg-blue-50/50"
        />
        <StatCard 
            icon={Award} 
            label="Streak" 
            value={`${stats.streakDays}d`} 
            colorClass="text-purple-600" 
            bgClass="bg-purple-50/50"
            subValue="Keep it up!"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Distribution */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Inventory Health</h3>
              <div className="bg-slate-100 p-2 rounded-lg">
                  <ArrowUpRight size={16} className="text-slate-500" />
              </div>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-12 text-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">{activeItems}</span>
                <p className="text-xs text-slate-400 font-medium">Active Items</p>
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Weekly Impact</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} barSize={12}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                    cursor={{ fill: '#f1f5f9', radius: 4 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="saved" name="Saved" fill="#10B981" radius={[4, 4, 4, 4]} stackId="a" />
                <Bar dataKey="waste" name="Wasted" fill="#EF4444" radius={[4, 4, 4, 4]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;