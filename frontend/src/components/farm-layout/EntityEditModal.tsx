import React, { useEffect } from "react";
import { Bars3Icon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm, FieldValues, SubmitHandler, Path, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType } from "zod";

interface Shelf { id: string; name: string; }
export type EntityType = 'farm' | 'row' | 'rack' | 'shelf' | 'fan' | 'sensorDevice';

interface EntityEditModalProps<TFormValues extends FieldValues> {
  open: boolean;
  onClose: () => void;
  defaultValues?: DefaultValues<TFormValues>;
  onSave: SubmitHandler<TFormValues>;
  title: string;
  entityType: EntityType;
  validationSchema: ZodType<TFormValues, any, any>;
}

export default function EntityEditModal<TFormValues extends FieldValues>({
  open,
  onClose,
  defaultValues,
  onSave,
  title,
  entityType,
  validationSchema,
}: EntityEditModalProps<TFormValues>) {
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset 
  } = useForm<TFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset, validationSchema]);

  const currentEntityType: EntityType = entityType; 

  const entityStyles = {
    farm: 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100',
    row: 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100',
    rack: 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100',
    shelf: 'bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100',
    fan: 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100',
    sensorDevice: 'bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100',
  };
  const iconBg = {
    farm: 'bg-blue-500',
    row: 'bg-green-500',
    rack: 'bg-yellow-500',
    shelf: 'bg-purple-500',
    fan: 'bg-red-500',
    sensorDevice: 'bg-indigo-500',
  };

  const renderError = (fieldName: Path<TFormValues>) => {
    const error = errors[fieldName];
    if (error && typeof error.message === 'string') {
      return <p className="text-sm text-red-500 mt-1">{error.message}</p>;
    }
    return null;
  };
  
  const entityId = (defaultValues as any)?.id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle asChild>
            <div className={`flex items-center gap-3 p-2 rounded ${entityStyles[currentEntityType]}`}>
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${iconBg[currentEntityType]} text-white`}><Bars3Icon className="w-5 h-5" /></span>
              <h2 className="text-lg font-bold">{title}</h2>
            </div>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave as SubmitHandler<FieldValues>)}>
          <hr className="my-4 border-gray-300 dark:border-gray-700" />
          <div className="flex flex-col gap-3 py-4">
            {entityId && (
              <div>
                <label className="text-xs text-gray-500">ID</label>
                <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">{entityId}</div>
              </div>
            )}
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
              <input
                id="name"
                className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                {...register("name" as Path<TFormValues>)}
              />
              {renderError("name" as Path<TFormValues>)}
            </div>

            {currentEntityType === 'farm' && (
              <>
                <div>
                  <label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-200">Location</label>
                  <input
                    id="location"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("location" as Path<TFormValues>)}
                  />
                  {renderError("location" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="width" className="text-sm font-medium text-gray-700 dark:text-gray-200">Width (meters)</label>
                  <input
                    id="width"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("width" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("width" as Path<TFormValues>)}
                </div>
                 <div>
                  <label htmlFor="depth" className="text-sm font-medium text-gray-700 dark:text-gray-200">Depth (meters)</label>
                  <input
                    id="depth"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("depth" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("depth" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="plan_image_url" className="text-sm font-medium text-gray-700 dark:text-gray-200">Plan Image URL (Optional)</label>
                  <input
                    id="plan_image_url"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("plan_image_url" as Path<TFormValues>)}
                  />
                  {renderError("plan_image_url" as Path<TFormValues>)}
                </div>
              </>
            )}
            {currentEntityType === 'row' && (
              <>
                <div>
                  <label htmlFor="farm_id" className="text-sm font-medium text-gray-700 dark:text-gray-200">Farm ID (Read-only)</label>
                  <input
                    id="farm_id"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    {...register("farm_id" as Path<TFormValues>)}
                    readOnly
                  />
                  {renderError("farm_id" as Path<TFormValues>)}
                </div>
                 <div>
                  <label htmlFor="position_x" className="text-sm font-medium text-gray-700 dark:text-gray-200">Position X</label>
                  <input
                    id="position_x"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("position_x" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("position_x" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="position_y" className="text-sm font-medium text-gray-700 dark:text-gray-200">Position Y</label>
                  <input
                    id="position_y"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("position_y" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("position_y" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="length" className="text-sm font-medium text-gray-700 dark:text-gray-200">Length</label>
                  <input
                    id="length"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("length" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("length" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="orientation" className="text-sm font-medium text-gray-700 dark:text-gray-200">Orientation</label>
                  <select
                    id="orientation"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("orientation" as Path<TFormValues>)}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                  {renderError("orientation" as Path<TFormValues>)}
                </div>
              </>
            )}
            {/* Fields for Rack entity type */}
            {currentEntityType === 'rack' && (
              <>
                <div>
                  <label htmlFor="row_id" className="text-sm font-medium text-gray-700 dark:text-gray-200">Row ID (Read-only)</label>
                  <input
                    id="row_id"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    {...register("row_id" as Path<TFormValues>)}
                    readOnly
                  />
                  {renderError("row_id" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="position_in_row" className="text-sm font-medium text-gray-700 dark:text-gray-200">Position in Row</label>
                  <input
                    id="position_in_row"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("position_in_row" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("position_in_row" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="width" className="text-sm font-medium text-gray-700 dark:text-gray-200">Width</label>
                  <input
                    id="width"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("width" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("width" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="depth" className="text-sm font-medium text-gray-700 dark:text-gray-200">Depth</label>
                  <input
                    id="depth"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("depth" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("depth" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="height" className="text-sm font-medium text-gray-700 dark:text-gray-200">Height</label>
                  <input
                    id="height"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("height" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("height" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="max_shelves" className="text-sm font-medium text-gray-700 dark:text-gray-200">Max Shelves (Optional)</label>
                  <input
                    id="max_shelves"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("max_shelves" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("max_shelves" as Path<TFormValues>)}
                </div>
              </>
            )}
            {/* Fields for Shelf entity type */}
            {currentEntityType === 'shelf' && (
              <>
                <div>
                  <label htmlFor="rack_id" className="text-sm font-medium text-gray-700 dark:text-gray-200">Rack ID (Read-only)</label>
                  <input
                    id="rack_id"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    {...register("rack_id" as Path<TFormValues>)}
                    readOnly
                  />
                </div>
                <div>
                  <label htmlFor="position_in_rack" className="text-sm font-medium text-gray-700 dark:text-gray-200">Position in Rack</label>
                  <input
                    id="position_in_rack"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("position_in_rack" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("position_in_rack" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="width" className="text-sm font-medium text-gray-700 dark:text-gray-200">Width</label>
                  <input
                    id="width"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("width" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("width" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="depth" className="text-sm font-medium text-gray-700 dark:text-gray-200">Depth</label>
                  <input
                    id="depth"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("depth" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("depth" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="max_weight" className="text-sm font-medium text-gray-700 dark:text-gray-200">Max Weight (Optional)</label>
                  <input
                    id="max_weight"
                    type="number"
                    className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    {...register("max_weight" as Path<TFormValues>, { valueAsNumber: true })}
                  />
                  {renderError("max_weight" as Path<TFormValues>)}
                </div>
              </>
            )}
            {/* Fields for Fan entity type */}
            {currentEntityType === 'fan' && (
              <>
                <div>
                  <label htmlFor="parent_type_fan" className="text-sm font-medium text-gray-700 dark:text-gray-200">Parent Type</label>
                  <select id="parent_type_fan" {...register("parent_type" as Path<TFormValues>)} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="rack">Rack</option>
                    <option value="row">Row</option>
                  </select>
                  {renderError("parent_type" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="parent_id_fan" className="text-sm font-medium text-gray-700 dark:text-gray-200">Parent ID (Read-only)</label>
                  <input id="parent_id_fan" {...register("parent_id" as Path<TFormValues>)} readOnly className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"/>
                </div>
                <div>
                  <label htmlFor="model_number_fan" className="text-sm font-medium text-gray-700 dark:text-gray-200">Model Number (Optional)</label>
                  <input id="model_number_fan" {...register("model_number" as Path<TFormValues>)} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  {renderError("model_number" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="type_fan" className="text-sm font-medium text-gray-700 dark:text-gray-200">Fan Type</label>
                  <select id="type_fan" {...register("type" as Path<TFormValues>)} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Select Type</option>
                    <option value="circulation">Circulation</option>
                    <option value="exhaust">Exhaust</option>
                    <option value="intake">Intake</option>
                  </select>
                  {renderError("type" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="size_cm_fan" className="text-sm font-medium text-gray-700 dark:text-gray-200">Size (cm) (Optional)</label>
                  <input id="size_cm_fan" type="number" {...register("size_cm" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  {renderError("size_cm" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="airflow_cfm_fan" className="text-sm font-medium text-gray-700 dark:text-gray-200">Airflow (CFM) (Optional)</label>
                  <input id="airflow_cfm_fan" type="number" {...register("airflow_cfm" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  {renderError("airflow_cfm" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="power_watts_fan" className="text-sm font-medium text-gray-700 dark:text-gray-200">Power (Watts) (Optional)</label>
                  <input id="power_watts_fan" type="number" {...register("power_watts" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  {renderError("power_watts" as Path<TFormValues>)}
                </div>
                <div><label className="text-xs font-semibold mt-2 text-gray-600 dark:text-gray-400">Position (Optional)</label></div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="position_x_fan" className="text-xs">X</label>
                    <input id="position_x_fan" type="number" {...register("position_x" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    {renderError("position_x" as Path<TFormValues>)}
                  </div>
                  <div>
                    <label htmlFor="position_y_fan" className="text-xs">Y</label>
                    <input id="position_y_fan" type="number" {...register("position_y" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    {renderError("position_y" as Path<TFormValues>)}
                  </div>
                  <div>
                    <label htmlFor="position_z_fan" className="text-xs">Z</label>
                    <input id="position_z_fan" type="number" {...register("position_z" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    {renderError("position_z" as Path<TFormValues>)}
                  </div>
                </div>
                <div>
                  <label htmlFor="orientation_fan" className="text-sm font-medium text-gray-700 dark:text-gray-200">Orientation (Optional)</label>
                  <select id="orientation_fan" {...register("orientation" as Path<TFormValues>)} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Select Orientation</option>
                    <option value="up">Up</option> <option value="down">Down</option>
                    <option value="front">Front</option> <option value="back">Back</option>
                    <option value="left">Left</option> <option value="right">Right</option>
                  </select>
                  {renderError("orientation" as Path<TFormValues>)}
                </div>
              </>
            )}
            {/* Fields for SensorDevice entity type */}
            {currentEntityType === 'sensorDevice' && (
              <>
                <div>
                  <label htmlFor="parent_type_sensor" className="text-sm font-medium text-gray-700 dark:text-gray-200">Parent Type</label>
                  <select id="parent_type_sensor" {...register("parent_type" as Path<TFormValues>)} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="shelf">Shelf</option>
                    <option value="rack">Rack</option>
                    <option value="row">Row</option>
                    <option value="farm">Farm</option>
                  </select>
                  {renderError("parent_type" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="parent_id_sensor" className="text-sm font-medium text-gray-700 dark:text-gray-200">Parent ID (Read-only)</label>
                  <input id="parent_id_sensor" {...register("parent_id" as Path<TFormValues>)} readOnly className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"/>
                </div>
                <div>
                  <label htmlFor="model_number_sensor" className="text-sm font-medium text-gray-700 dark:text-gray-200">Model Number (Optional)</label>
                  <input id="model_number_sensor" {...register("model_number" as Path<TFormValues>)} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  {renderError("model_number" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="sensor_type_sensor" className="text-sm font-medium text-gray-700 dark:text-gray-200">Sensor Type</label>
                  <select id="sensor_type_sensor" {...register("sensor_type" as Path<TFormValues>)} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Select Type</option>
                    <option value="temperature">Temperature</option>
                    <option value="humidity">Humidity</option>
                    <option value="co2">CO2</option>
                    <option value="ph">pH</option>
                    <option value="ec">EC (Electrical Conductivity)</option>
                    <option value="water_level">Water Level</option>
                    <option value="light_intensity">Light Intensity</option>
                    <option value="air_flow">Air Flow</option>
                    <option value="soil_moisture">Soil Moisture</option>
                  </select>
                  {renderError("sensor_type" as Path<TFormValues>)}
                </div>
                <div>
                  <label htmlFor="measurement_unit_sensor" className="text-sm font-medium text-gray-700 dark:text-gray-200">Measurement Unit (Optional)</label>
                  <input id="measurement_unit_sensor" {...register("measurement_unit" as Path<TFormValues>)} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  {renderError("measurement_unit" as Path<TFormValues>)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="data_range_min_sensor" className="text-sm font-medium text-gray-700 dark:text-gray-200">Data Range Min (Optional)</label>
                    <input id="data_range_min_sensor" type="number" {...register("data_range_min" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    {renderError("data_range_min" as Path<TFormValues>)}
                  </div>
                  <div>
                    <label htmlFor="data_range_max_sensor" className="text-sm font-medium text-gray-700 dark:text-gray-200">Data Range Max (Optional)</label>
                    <input id="data_range_max_sensor" type="number" {...register("data_range_max" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    {renderError("data_range_max" as Path<TFormValues>)}
                  </div>
                </div>
                <div>
                  <label htmlFor="accuracy_sensor" className="text-sm font-medium text-gray-700 dark:text-gray-200">Accuracy (Optional)</label>
                  <input id="accuracy_sensor" {...register("accuracy" as Path<TFormValues>)} className="mt-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  {renderError("accuracy" as Path<TFormValues>)}
                </div>
                <div><label className="text-xs font-semibold mt-2 text-gray-600 dark:text-gray-400">Position (Optional)</label></div>
                 <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="position_x_sensor" className="text-xs">X</label>
                    <input id="position_x_sensor" type="number" {...register("position_x" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    {renderError("position_x" as Path<TFormValues>)}
                  </div>
                  <div>
                    <label htmlFor="position_y_sensor" className="text-xs">Y</label>
                    <input id="position_y_sensor" type="number" {...register("position_y" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    {renderError("position_y" as Path<TFormValues>)}
                  </div>
                  <div>
                    <label htmlFor="position_z_sensor" className="text-xs">Z</label>
                    <input id="position_z_sensor" type="number" {...register("position_z" as Path<TFormValues>, { valueAsNumber: true })} className="mt-1 w-full p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    {renderError("position_z" as Path<TFormValues>)}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="mt-8">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
