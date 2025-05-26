"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Award, Trophy, Target, Star } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  earned: boolean
  progress: number
}

interface AchievementBadgesProps {
  achievements: Achievement[]
}

const getAchievementIcon = (id: string) => {
  switch (id) {
    case "first_trade":
      return <Star className="h-4 w-4" />
    case "tax_exempt":
      return <Trophy className="h-4 w-4" />
    case "diversified":
      return <Target className="h-4 w-4" />
    default:
      return <Award className="h-4 w-4" />
  }
}

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  const earnedCount = achievements.filter((a) => a.earned).length

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Award className="mr-2 h-5 w-5 text-brand-blue" />
            Conquistas
          </div>
          <Badge variant="secondary">
            {earnedCount}/{achievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border ${
              achievement.earned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-full ${
                  achievement.earned ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                {getAchievementIcon(achievement.id)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium ${achievement.earned ? "text-green-900" : "text-gray-900"}`}>
                    {achievement.name}
                  </h4>
                  {achievement.earned && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓
                    </Badge>
                  )}
                </div>

                <p className={`text-sm ${achievement.earned ? "text-green-700" : "text-gray-600"}`}>
                  {achievement.description}
                </p>

                {!achievement.earned && achievement.progress > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{achievement.progress}%</span>
                    </div>
                    <Progress value={achievement.progress} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {earnedCount === achievements.length && (
          <div className="text-center py-4">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Parabéns! Você conquistou todas as medalhas! 🎉</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
