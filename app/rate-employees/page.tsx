"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Goal, Rating, User } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  BsPersonLinesFill,
  BsStar,
  BsStarFill,
  BsCheck2Circle,
  BsExclamationCircle,
  BsArrowRight,
  BsFilter,
  BsGrid,
  BsList,
  BsCheckCircle,
  BsHourglassSplit,
  BsClipboardData,
  BsBarChart,
  BsCalendar
} from "react-icons/bs";

interface GoalWithRating extends Goal {
  rating?: {
    id: string;
    score: number;
    comments?: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface EmployeeStats {
  id: string;
  name: string;
  totalGoals: number;
  ratedGoals: number;
}

const RATING_LABELS = {
  1: "Needs Improvement",
  2: "Below Expectations",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding"
} as const;

const RATING_DESCRIPTIONS = {
  1: "Performance consistently falls below expected standards. Significant improvement needed in key areas.",
  2: "Performance occasionally meets standards but improvement is needed to fully meet expectations.",
  3: "Performance consistently meets job requirements and expectations. Demonstrates solid competence.",
  4: "Performance frequently exceeds job requirements. Demonstrates strong skills and initiative.",
  5: "Performance consistently exceeds all expectations. Demonstrates exceptional achievements."
} as const;

const RATING_COLORS = {
  1: "text-red-400 border-red-500 bg-red-500/10",
  2: "text-orange-400 border-orange-500 bg-orange-500/10",
  3: "text-yellow-400 border-yellow-500 bg-yellow-500/10",
  4: "text-green-400 border-green-500 bg-green-500/10",
  5: "text-blue-400 border-blue-500 bg-blue-500/10"
} as const;

const RATING_HOVER_COLORS = {
  1: "hover:bg-red-500 hover:text-white",
  2: "hover:bg-orange-500 hover:text-white",
  3: "hover:bg-yellow-500 hover:text-white",
  4: "hover:bg-green-500 hover:text-white",
  5: "hover:bg-blue-500 hover:text-white"
} as const;

export default function RateEmployeesPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);

  useEffect(() => {
    fetchEmployeeGoals();
  }, []);

  useEffect(() => {
    const stats = calculateEmployeeStats(goals);
    setEmployeeStats(stats);
  }, [goals]);

  const calculateEmployeeStats = (goals: GoalWithRating[]): EmployeeStats[] => {
    const statsMap = new Map<string, EmployeeStats>();
    
    goals.forEach(goal => {
      const { employee } = goal;
      const currentStats = statsMap.get(employee.id) || {
        id: employee.id,
        name: employee.name,
        totalGoals: 0,
        ratedGoals: 0
      };
      
      currentStats.totalGoals++;
      if (goal.rating?.score) {
        currentStats.ratedGoals++;
      }
      
      statsMap.set(employee.id, currentStats);
    });
    
    return Array.from(statsMap.values());
  };

  const fetchEmployeeGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals/manager");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch goals");
      }
      
      const data = await response.json();
      console.log('Fetched goals:', data); // Debug log
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: expected an array of goals");
      }
      
      setGoals(data);
      toast.success("Goals loaded successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load goals";
      console.error("Error fetching goals:", error);
      toast.error(errorMessage);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = async (goalId: string, value: number) => {
    if (isNaN(value)) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/goals/${goalId}/manager-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: value,
          comments: ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update rating');
      }

      // Update the goals state with the new rating
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                rating: { 
                  id: data.id, 
                  score: value,
                  comments: data.comments || ''
                } 
              } 
            : goal
        )
      );

      toast.success('Rating updated successfully');
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update rating');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filterEmployee !== 'all' && goal.employee.id !== filterEmployee) return false;
    if (filterRating !== 'all' && goal.rating?.score !== parseInt(filterRating)) return false;
    return true;
  });

  return (
    <DashboardLayout type="manager">
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <BsStarFill className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Rate Employee Goals</h1>
              <p className="text-gray-400">Evaluate and provide feedback on employee performance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">View:</span>
            <div className="flex items-center gap-1 bg-[#252832] p-1 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 ${viewMode === 'list' ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-400 hover:text-white'}`}
              >
                <BsList className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 ${viewMode === 'grid' ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-400 hover:text-white'}`}
              >
                <BsGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 text-blue-400 mb-3">
                <BsClipboardData className="w-5 h-5" />
                <span className="text-lg font-semibold">Total Goals</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {goals.length}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 text-green-400 mb-3">
                <BsCheckCircle className="w-5 h-5" />
                <span className="text-lg font-semibold">Rated Goals</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {goals.filter(g => g.rating?.score).length}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 text-yellow-400 mb-3">
                <BsBarChart className="w-5 h-5" />
                <span className="text-lg font-semibold">Average Rating</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {goals.length > 0
                  ? (goals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0) / goals.length).toFixed(1)
                  : '0.0'}
              </div>
            </div>
          </Card>
        </div>

        {/* Employee Filter */}
        <div className="flex justify-end">
          <div className="relative group min-w-[280px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsPersonLinesFill className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="pl-10 pr-4 py-3 bg-[#252832] text-white rounded-xl border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-400 transition-all shadow-md">
                <div className="flex items-center gap-2">
                  <SelectValue placeholder="Filter by employee..." className="text-indigo-100" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#1E2028] border-indigo-500/30">
                <SelectItem value="all" className="hover:bg-indigo-500/10 focus:bg-indigo-500/10">
                  <div className="flex items-center gap-2">
                    <BsPersonLinesFill className="w-4 h-4 text-indigo-400" />
                    <span className="text-indigo-100 font-medium">All Employees</span>
                  </div>
                </SelectItem>
                {employeeStats.map(emp => (
                  <SelectItem key={emp.id} value={emp.id} className="hover:bg-indigo-500/10 focus:bg-indigo-500/10">
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex items-center gap-2">
                        <BsPersonLinesFill className="w-4 h-4 text-indigo-400" />
                        <span className="text-indigo-100">{emp.name}</span>
                      </div>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full font-medium">
                        {emp.ratedGoals}/{emp.totalGoals} rated
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Goals List */}
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {filteredGoals.map((goal) => (
            <Card key={goal.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">{goal.employee.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{goal.employee.name}</h3>
                      <p className="text-sm text-gray-400">{goal.employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BsCalendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {new Date(goal.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-semibold text-white">{goal.title}</h4>
                  <p className="text-gray-300 leading-relaxed">{goal.description}</p>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">Rating</Label>
                    {goal.rating?.score && (
                      <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                        {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4 py-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant="outline"
                        size="icon"
                        onClick={() => handleRatingChange(goal.id, rating)}
                        className={`w-14 h-14 ${
                          goal.rating?.score === rating
                            ? RATING_COLORS[rating as keyof typeof RATING_COLORS]
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        } ${RATING_HOVER_COLORS[rating as keyof typeof RATING_HOVER_COLORS]} transition-all duration-200`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <BsStarFill className="w-5 h-5" />
                          <span className="text-xs">{rating}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  {goal.rating?.score && (
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                      <p className={`text-sm font-medium mb-2 ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                        {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                      </p>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS]}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 