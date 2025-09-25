import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useUserRewards, useSkillCoins, useUserLevel, useSubjectProgress, useSkillLevels } from '@/hooks/use-user-rewards'
import { 
  Coins, 
  TrendingUp, 
  Award, 
  Star, 
  BookOpen, 
  Brain, 
  Target,
  Clock,
  Trophy
} from 'lucide-react'

interface RealtimeDashboardProps {
  uid: string
}

export function RealtimeDashboard({ uid }: RealtimeDashboardProps) {
  const { skillCoins, totalEarned, formattedCoins, loading: coinsLoading } = useSkillCoins(uid)
  const { level, currentXP, xpToNextLevel, levelProgress, loading: levelLoading } = useUserLevel(uid)
  const { subjects, totalSubjects, averageProgress, loading: subjectsLoading } = useSubjectProgress(uid)
  const { skills, totalSkills, expertSkills, advancedSkills, loading: skillsLoading } = useSkillLevels(uid)

  if (coinsLoading || levelLoading || subjectsLoading || skillsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Skill Coins */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium">Skill Coins</span>
            </div>
            <div className="text-2xl font-bold">{formattedCoins}</div>
            <div className="flex items-center gap-1 text-xs text-accent">
              <TrendingUp className="h-3 w-3" />
              <span>{totalEarned.toLocaleString()} total earned</span>
            </div>
          </CardContent>
        </Card>

        {/* Level */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Level</span>
            </div>
            <div className="text-2xl font-bold">{level}</div>
            <div className="space-y-1">
              <Progress value={levelProgress} className="h-2" />
              <span className="text-xs text-muted-foreground">
                {xpToNextLevel} XP to level up
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">Subjects</span>
            </div>
            <div className="text-2xl font-bold">{totalSubjects}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>{Math.round(averageProgress)}% avg progress</span>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium">Skills</span>
            </div>
            <div className="text-2xl font-bold">{totalSkills}</div>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="px-1 text-xs">
                {expertSkills} Expert
              </Badge>
              <Badge variant="outline" className="px-1 text-xs">
                {advancedSkills} Advanced
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Subject Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Subject Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.slice(0, 5).map((subject) => (
              <div key={subject.subjectId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{subject.subjectName}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{Math.round(subject.timeSpent / 60)}h</span>
                  </div>
                </div>
                <Progress 
                  value={(subject.lessonsCompleted / subject.totalLessons) * 100} 
                  className="h-2" 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{subject.lessonsCompleted}/{subject.totalLessons} lessons</span>
                  <span>Level {subject.level}</span>
                </div>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No subjects started yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Skill Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-destructive" />
              Skill Mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skills.slice(0, 8).map((skill) => (
              <div key={skill.skillId} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{skill.skillName}</span>
                    <Badge 
                      variant={
                        skill.level === 'expert' ? 'default' :
                        skill.level === 'advanced' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {skill.level}
                    </Badge>
                  </div>
                  <Progress value={skill.score} className="h-2" />
                  <span className="text-xs text-muted-foreground">{skill.score}/100</span>
                </div>
              </div>
            ))}
            {skills.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Complete modules to develop skills
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Component for rewards page integration
export function RealtimeRewardsStats({ uid }: { uid: string }) {
  const { skillCoins, totalEarned, formattedCoins } = useSkillCoins(uid)
  const { level } = useUserLevel(uid)

  return (
    <Card className="bg-gradient-to-r from-secondary/20 to-accent/20 border-secondary/30">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
              <Coins className="h-8 w-8 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{formattedCoins} Skill Coins</h2>
              <p className="text-muted-foreground">Available for redemption</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-accent">
              <Trophy className="h-5 w-5" />
              <span className="font-medium">Level {level}</span>
            </div>
            <p className="text-sm text-muted-foreground">{totalEarned.toLocaleString()} total earned</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}