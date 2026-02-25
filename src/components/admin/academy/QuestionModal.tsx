"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Plus, Trash, Check } from "lucide-react";
import { clsx } from "clsx";

const optionSchema = z.object({
    id: z.string().optional(),
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean(),
});

const schema = z.object({
    text: z.string().min(1, "Question text is required"),
    options: z.array(optionSchema).min(2, "At least 2 options required"),
});

type FormData = z.infer<typeof schema>;

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    quizId: string;
    question?: any; // If editing
    onSaved: () => void;
}

export function QuestionModal({ isOpen, onClose, quizId, question, onSaved }: QuestionModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            text: "",
            options: [
                { text: "", isCorrect: false },
                { text: "", isCorrect: false }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "options",
    });

    const options = watch("options");

    useEffect(() => {
        if (question) {
            reset({
                text: question.text,
                options: question.options.map((o: any) => ({
                    id: o.id,
                    text: o.text,
                    isCorrect: o.isCorrect
                }))
            });
        } else {
            reset({
                text: "",
                options: [
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false }
                ]
            });
        }
    }, [question, reset, isOpen]);

    const handleSetCorrect = (index: number) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index
        }));
        setValue("options", newOptions);
    };

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const url = question
                ? `/api/academy/questions/${question.id}`
                : `/api/academy/quizzes/${quizId}/questions`;

            const method = question ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to save question");

            toast.success(question ? "Question updated" : "Question added");
            onSaved();
            onClose();
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={question ? "Edit Question" : "Add Question"}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Question Text</label>
                    <textarea
                        {...register("text")}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 min-h-[80px] resize-none"
                        placeholder="What is the maximum leverage in forex trading?"
                    />
                    {errors.text && <p className="text-red-500 text-xs">{errors.text.message}</p>}
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex justify-between">
                        <span>Answer Options</span>
                        <span className="text-xs font-normal text-gray-400">Click to mark correct answer</span>
                    </label>

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-center">
                                <button
                                    type="button"
                                    onClick={() => handleSetCorrect(index)}
                                    className={clsx(
                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                                        options[index]?.isCorrect
                                            ? "bg-primary border-primary text-white"
                                            : "border-gray-300 hover:border-primary text-gray-300"
                                    )}
                                >
                                    <Check size={14} />
                                </button>

                                <div className="flex-1">
                                    <input
                                        {...register(`options.${index}.text` as const)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        placeholder={`Option ${index + 1}`}
                                    />
                                    {errors.options?.[index]?.text && (
                                        <p className="text-red-500 text-xs mt-1">{errors.options[index]?.text?.message}</p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    disabled={fields.length <= 2}
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {errors.options && <p className="text-red-500 text-xs">{errors.options.message}</p>}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ text: "", isCorrect: false })}
                        className="w-full border border-dashed border-gray-300 dark:border-white/10 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                        <Plus size={16} className="mr-2" />
                        Add Option
                    </Button>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-bold rounded-xl px-6"
                    >Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="bg-primary hover:bg-[#00b078] text-white border-none shadow-lg shadow-primary/30 rounded-xl px-6 font-bold"
                    >
                        Save Question
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
