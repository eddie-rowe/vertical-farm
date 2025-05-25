'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { GrowRecipe, Species, CreateGrowRecipeInput, LightingSchedule } from '@/types/grow-recipes';
import { createGrowRecipe, updateGrowRecipe } from '@/services/growRecipeService';
import { createSpecies } from '@/services/growRecipeService';

// Form validation schema
const growRecipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required'),
  species_id: z.string().min(1, 'Species selection is required'),
  recipe_source: z.string().optional(),
  
  // Basic growing parameters
  grow_days: z.number().int().min(1).optional().or(z.literal('')),
  light_hours_per_day: z.number().min(0).max(24).optional().or(z.literal('')),
  watering_frequency_hours: z.number().min(0).optional().or(z.literal('')),
  
  // Environmental parameters
  target_temperature_min: z.number().optional().or(z.literal('')),
  target_temperature_max: z.number().optional().or(z.literal('')),
  target_humidity_min: z.number().min(0).max(100).optional().or(z.literal('')),
  target_humidity_max: z.number().min(0).max(100).optional().or(z.literal('')),
  target_ph_min: z.number().min(0).max(14).optional().or(z.literal('')),
  target_ph_max: z.number().min(0).max(14).optional().or(z.literal('')),
  target_ec_min: z.number().min(0).optional().or(z.literal('')),
  target_ec_max: z.number().min(0).optional().or(z.literal('')),
  
  // Yield and seeding
  average_yield: z.number().min(0).optional().or(z.literal('')),
  sowing_rate: z.number().min(0).optional().or(z.literal('')),
  
  // New grow recipe parameters
  germination_days: z.number().int().min(0).optional().or(z.literal('')),
  light_days: z.number().int().min(0).optional().or(z.literal('')),
  total_grow_days: z.number().int().min(1).optional().or(z.literal('')),
  top_coat: z.string().optional(),
  pythium_risk: z.enum(['Low', 'Medium', 'High']).optional(),
  water_intake: z.number().min(0).optional().or(z.literal('')),
  water_frequency: z.string().optional(),
  fridge_storage_temp: z.number().optional().or(z.literal('')),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});

type GrowRecipeFormData = z.infer<typeof growRecipeSchema>;

interface GrowRecipeFormProps {
  recipe?: GrowRecipe | null;
  species: Species[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function GrowRecipeForm({ recipe, species, onSuccess, onCancel }: GrowRecipeFormProps) {
  const [loading, setLoading] = useState(false);
  const [showSpeciesDialog, setShowSpeciesDialog] = useState(false);
  const [newSpeciesName, setNewSpeciesName] = useState('');
  const [newSpeciesDescription, setNewSpeciesDescription] = useState('');
  const [creatingSpecies, setCreatingSpecies] = useState(false);
  const [localSpecies, setLocalSpecies] = useState<Species[]>(species);

  const form = useForm<GrowRecipeFormData>({
    resolver: zodResolver(growRecipeSchema),
    defaultValues: {
      name: recipe?.name || '',
      species_id: recipe?.species_id || '',
      recipe_source: recipe?.recipe_source || '',
      grow_days: recipe?.grow_days || '',
      light_hours_per_day: recipe?.light_hours_per_day || '',
      watering_frequency_hours: recipe?.watering_frequency_hours || '',
      target_temperature_min: recipe?.target_temperature_min || '',
      target_temperature_max: recipe?.target_temperature_max || '',
      target_humidity_min: recipe?.target_humidity_min || '',
      target_humidity_max: recipe?.target_humidity_max || '',
      target_ph_min: recipe?.target_ph_min || '',
      target_ph_max: recipe?.target_ph_max || '',
      target_ec_min: recipe?.target_ec_min || '',
      target_ec_max: recipe?.target_ec_max || '',
      average_yield: recipe?.average_yield || '',
      sowing_rate: recipe?.sowing_rate || '',
      germination_days: recipe?.germination_days || '',
      light_days: recipe?.light_days || '',
      total_grow_days: recipe?.total_grow_days || '',
      top_coat: recipe?.top_coat || '',
      pythium_risk: recipe?.pythium_risk || undefined,
      water_intake: recipe?.water_intake || '',
      water_frequency: recipe?.water_frequency || '',
      fridge_storage_temp: recipe?.fridge_storage_temp || '',
      difficulty: recipe?.difficulty || undefined,
    },
  });

  const handleCreateSpecies = async () => {
    if (!newSpeciesName.trim()) return;

    try {
      setCreatingSpecies(true);
      const newSpecies = await createSpecies({
        name: newSpeciesName.trim(),
        description: newSpeciesDescription.trim() || undefined,
      });
      
      if (newSpecies) {
        setLocalSpecies([...localSpecies, newSpecies]);
        form.setValue('species_id', newSpecies.id);
        setShowSpeciesDialog(false);
        setNewSpeciesName('');
        setNewSpeciesDescription('');
        toast.success('Species created successfully');
      }
    } catch (error) {
      console.error('Error creating species:', error);
      toast.error('Failed to create species');
    } finally {
      setCreatingSpecies(false);
    }
  };

  const onSubmit = async (data: GrowRecipeFormData) => {
    try {
      setLoading(true);

      // Convert empty strings to undefined/null for numeric fields
      const cleanedData: CreateGrowRecipeInput = {
        ...data,
        grow_days: data.grow_days === '' ? undefined : Number(data.grow_days),
        light_hours_per_day: data.light_hours_per_day === '' ? undefined : Number(data.light_hours_per_day),
        watering_frequency_hours: data.watering_frequency_hours === '' ? undefined : Number(data.watering_frequency_hours),
        target_temperature_min: data.target_temperature_min === '' ? undefined : Number(data.target_temperature_min),
        target_temperature_max: data.target_temperature_max === '' ? undefined : Number(data.target_temperature_max),
        target_humidity_min: data.target_humidity_min === '' ? undefined : Number(data.target_humidity_min),
        target_humidity_max: data.target_humidity_max === '' ? undefined : Number(data.target_humidity_max),
        target_ph_min: data.target_ph_min === '' ? undefined : Number(data.target_ph_min),
        target_ph_max: data.target_ph_max === '' ? undefined : Number(data.target_ph_max),
        target_ec_min: data.target_ec_min === '' ? undefined : Number(data.target_ec_min),
        target_ec_max: data.target_ec_max === '' ? undefined : Number(data.target_ec_max),
        average_yield: data.average_yield === '' ? undefined : Number(data.average_yield),
        sowing_rate: data.sowing_rate === '' ? undefined : Number(data.sowing_rate),
        germination_days: data.germination_days === '' ? undefined : Number(data.germination_days),
        light_days: data.light_days === '' ? undefined : Number(data.light_days),
        total_grow_days: data.total_grow_days === '' ? undefined : Number(data.total_grow_days),
        water_intake: data.water_intake === '' ? undefined : Number(data.water_intake),
        fridge_storage_temp: data.fridge_storage_temp === '' ? undefined : Number(data.fridge_storage_temp),
      };

      if (recipe) {
        await updateGrowRecipe(recipe.id, cleanedData);
        toast.success('Recipe updated successfully');
      } else {
        await createGrowRecipe(cleanedData);
        toast.success('Recipe created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential recipe details and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Basil Genovese - High Yield" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="species_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Species *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select species" />
                        </SelectTrigger>
                        <SelectContent>
                          {localSpecies.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <Dialog open={showSpeciesDialog} onOpenChange={setShowSpeciesDialog}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Species</DialogTitle>
                          <DialogDescription>
                            Create a new plant species for your recipes.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="species-name">Species Name *</Label>
                            <Input
                              id="species-name"
                              value={newSpeciesName}
                              onChange={(e) => setNewSpeciesName(e.target.value)}
                              placeholder="e.g., Basil Genovese"
                            />
                          </div>
                          <div>
                            <Label htmlFor="species-description">Description</Label>
                            <Input
                              id="species-description"
                              value={newSpeciesDescription}
                              onChange={(e) => setNewSpeciesDescription(e.target.value)}
                              placeholder="Optional description"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowSpeciesDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleCreateSpecies}
                              disabled={!newSpeciesName.trim() || creatingSpecies}
                            >
                              {creatingSpecies && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Create Species
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipe_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Source</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Supplier X, Internal R&D" {...field} />
                  </FormControl>
                  <FormDescription>Where did this recipe come from?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Growing Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Growing Timeline</CardTitle>
            <CardDescription>Duration and phases of the growing cycle</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="germination_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Germination Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="3"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="light_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Light Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total_grow_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Grow Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="14"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Auto-calculated if left empty</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="light_hours_per_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Light Hours/Day</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      placeholder="16"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Cultivation Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Cultivation Parameters</CardTitle>
            <CardDescription>Seeding, watering, and growing conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sowing_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seed Density (g/tray)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="2.5"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="average_yield"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avg Tray Yield (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="150"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="top_coat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Top Coat</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Vermiculite, None" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="water_intake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Water Intake (ml/tray)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="500"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="water_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Water Frequency</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Once daily, Twice daily" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fridge_storage_temp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Temp (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="4"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <FormControl>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pythium_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pythium Risk</FormLabel>
                    <FormControl>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Environmental Ranges */}
        <Card>
          <CardHeader>
            <CardTitle>Environmental Ranges</CardTitle>
            <CardDescription>Optimal growing conditions (all optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temperature */}
              <div className="space-y-2">
                <Label>Temperature (°C)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="target_temperature_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Min"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target_temperature_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Max"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Humidity */}
              <div className="space-y-2">
                <Label>Humidity (%)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="target_humidity_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Min"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target_humidity_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Max"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* pH */}
              <div className="space-y-2">
                <Label>pH</Label>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="target_ph_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="14"
                            step="0.1"
                            placeholder="Min"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target_ph_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="14"
                            step="0.1"
                            placeholder="Max"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* EC */}
              <div className="space-y-2">
                <Label>EC (μS/cm)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="target_ec_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Min"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target_ec_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Max"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {recipe ? 'Update Recipe' : 'Create Recipe'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 