'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ESOPForm } from '@/components/esops/esop-form';
import { employeeApi } from '@/lib/api';
import { Employee } from '@/types';
import { TrendingUp, Calendar, Users, Award, Clock, DollarSign, Trash2 } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatDistanceToNow } from 'date-fns';
import { LoadingSpinnerFull } from '@/components/ui/loading-spinner';
import {
  formatVestingData,
} from '@/utils/esopsContractUtils';
import { toast } from 'react-toastify';


interface VestingData {
  employee: string;
  totalAmount: number;
  claimed: number;
  start: number;
  cliff: number;
  duration: number;
  vestedAmount: number;
  unvestedAmount: number;
  cliffReached: boolean;
  fullyVested: boolean;
  claimableAmount: number;
  id: string;
}


export default function ESOPsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vestings, setVestings] = useState<VestingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('getting call')
      const [employeesData, vestingsData] = await Promise.all([
        employeeApi.getAll(),
        loadVestingsFromAPI(),
      ]);
      console.log(vestingsData, "after fetch")
      setEmployees(employeesData);
      setVestings(vestingsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleESOPCreated = async (esopData: any) => {
    try {
      // Make API request to your backend
      console.log('Creating ESOP with data:', esopData);
      await fetch(`/api/esops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(esopData),
      });

      // Refresh data after creation
      await loadData();
    } catch (error) {
      console.error('Failed to create ESOP:', error);
    }
  };

  const loadVestingsFromAPI = async (): Promise<VestingData[]> => {
    try {
      const response = await fetch("/api/esops", { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch vestings");

      const vestingsresponse = await response.json();

      console.log(vestingsresponse.data[0], "vesting")

      if (!vestingsresponse.data) return [];

      return vestingsresponse?.data?.map((vesting: any) => {
        const formatted = formatVestingData({
          totalAmount: vesting.tokenAmount,
          claimed: vesting.claimed || 0,
          start: Math.floor(new Date(vesting.vestingStart).getTime() / 1000),
          cliff: vesting.cliffMonths,
          duration: vesting.vestingMonths
        });

        if (!formatted) return null;
        return {
          employee: vesting.employeeId.walletAddress, // OR include full employee object
          ...formatted,
          employeeDetails: vesting.employeeId,
          id: vesting._id // optional full employee data
        };
      })
        .filter((v: any) => v !== null); // remove invalid entries
    } catch (error) {
      console.error("Error loading vestings from API:", error);
      return [];
    }
  };

  async function deleteVesting(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/esops/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      console.log(data.message);

      toast.success(data.message);
      await loadData();
    } catch (error) {
      toast.error("Failed to remove esop");
      console.log(error, "Failed to remove esop");
    }
    finally{
      setLoading(false);
    }
  }

  const totalTokens = vestings.reduce((sum, vesting) => sum + (vesting.totalAmount), 0);
  const activeEsops = vestings.filter(vesting => {
    const now = Math.floor(Date.now() / 1000);
    const vestingEnd = vesting.start + (vesting.duration * 30 * 24 * 60 * 60); // Convert months to seconds
    return now >= vesting.start && now <= vestingEnd;
  }).length;

  if (loading) {
    return (
      <div className="flex-1 space-y-8 p-8 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">ESOP Management</h2>
            <p className="text-muted-foreground">
              Grant and track employee stock option plans.
            </p>
          </div>
        </div>
        <LoadingSpinnerFull text="Loading ESOP data..." />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">ESOP Management</h2>
          <p className="text-muted-foreground">
            Grant and track employee stock option plans.
          </p>
        </div>

        <ESOPForm employees={employees} onESOPCreated={handleESOPCreated} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={employees.length}
          description="Eligible for ESOPs"
          icon={Users}
        />
        <StatsCard
          title="Active ESOPs"
          value={activeEsops}
          description="Currently vesting"
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Tokens"
          value={totalTokens.toFixed(2)}
          description="ANDR granted to date"
          icon={Award}
        />
        <StatsCard
          title="Avg Vesting"
          value={vestings.length > 0 ? Math.round(vestings.reduce((sum, vesting) => sum + vesting.duration, 0) / vestings.length) : 48}
          description="months"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 flex-1">
        <Card className="min-h-[500px] border-border">
          <CardHeader>
            <CardTitle>ESOP Grants</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {vestings.length > 0 ? (
                vestings.map((vesting) => {
                  // Find employee by wallet address
                  const employee = employees.find(emp => emp.walletAddress.toLowerCase() === vesting.employee.toLowerCase());

                  // Calculate vesting details
                  const vestingStart = new Date(vesting.start * 1000); // Convert from seconds to milliseconds
                  const now = new Date();
                  const vestingEnd = new Date((vesting.start + vesting.duration * 30 * 24 * 60 * 60) * 1000);
                  const cliffEnd = new Date((vesting.start + vesting.cliff * 30 * 24 * 60 * 60) * 1000);

                  const daysRemaining = Math.max(0, Math.ceil((vestingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                  const isCliffPassed = now >= cliffEnd;
                  const isVestingActive = now >= vestingStart && now <= vestingEnd;

                  return (
                    <div key={vesting.employee} className="p-4 border border-border rounded-lg bg-card shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="font-medium text-base text-foreground">
                              {employee?.name || `${vesting.employee.slice(0, 6)}...${vesting.employee.slice(-4)}`}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${isVestingActive
                              ? 'bg-primary/20 text-primary'
                              : now < vestingStart
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary/20 text-primary'
                              }`}>
                              {isVestingActive ? 'Active' : now < vestingStart ? 'Pending' : 'Completed'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {employee?.designation || 'Employee'}
                          </p>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Total Tokens (ANDR)</p>
                              <p className="text-base font-semibold text-foreground">{(vesting.totalAmount).toFixed(6)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Vested Tokens (ANDR)</p>
                              <p className="text-base font-semibold text-foreground">{(vesting.vestedAmount).toFixed(6)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <p className="font-medium text-muted-foreground">Vesting Period</p>
                              <p className="text-foreground">{vesting.duration} months</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Cliff Period</p>
                              <p className="text-foreground">{vesting.cliff} months</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Days Remaining</p>
                              <p className="text-foreground">{daysRemaining}</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteVesting(vesting.id)}
                            className="mb-2 hover:bg-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <p className="text-xs text-muted-foreground mb-1">Started</p>
                          <p className="text-xs font-medium text-foreground">
                            {formatDistanceToNow(vestingStart, { addSuffix: true })}
                          </p>
                          {!isCliffPassed && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground font-medium">Cliff Active</p>
                              <p className="text-xs text-muted-foreground">
                                {Math.ceil((cliffEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days left
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Vesting Progress</span>
                          <span>{Math.round(((vesting.vestedAmount) / (vesting.totalAmount)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(((vesting.vestedAmount) / (vesting.totalAmount)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No ESOPs Granted Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start granting employee stock options to incentivize and retain talent.
                  </p>
                  <ESOPForm employees={employees} onESOPCreated={handleESOPCreated} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[500px] border-border">
          <CardHeader>
            <CardTitle>Eligible Employees</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {employees.slice(0, 5).map((employee) => (
                <div key={employee._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.designation}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                     Andr {employee.salaryUSD.toLocaleString()} /month
                  </div>
                </div>
              ))}
              {employees.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{employees.length - 5} more employees
                </p>
              )}
              {employees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No employees found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}