"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import useAnchorProvider from "@/hooks/use-anchor-provider";
import TodoProgram from "@/lib/todo-program";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  useToast,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function NewProfile() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Add state to track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);

  const { publicKey } = useWallet();
  const [name, setName] = useState("");
  const provider = useAnchorProvider();

  // Ensure component only renders on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Move all hooks BEFORE any conditional returns
  const { isPending, mutateAsync } = useMutation({
    mutationKey: ["create-profile", provider?.publicKey],
    mutationFn: async (name: string) => {
      if (!provider) {
        throw new Error("Wallet not connected");
      }

      // Add additional validation for provider properties
      if (!provider.publicKey) {
        throw new Error("Wallet public key not available");
      }

      // Add validation for wallet methods
      if (!provider.wallet?.signTransaction || !provider.wallet?.signAllTransactions) {
        throw new Error("Wallet does not support required signing methods");
      }

      const program = new TodoProgram(provider);
      const tx = await program.createProfile(name);
      const signature = await provider.sendAndConfirm(tx);
      return signature;
    },
    onSuccess: (tx) => {
      console.log(tx);
      toast({
        title: "Transaction sent",
        status: "success",
      });

      return queryClient.invalidateQueries({
        queryKey: ["profile", provider?.publicKey?.toBase58()],
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error creating profile",
        description: error.message,
        status: "error",
      });
    },
    onSettled: () => {
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name is required",
        status: "warning",
      });
      return;
    }
    mutateAsync(name);
  };

  // NOW you can have conditional returns AFTER all hooks
  // Don't render anything until mounted on client-side
  if (!isMounted) {
    return null;
  }

  // Show disabled button if wallet not connected
  if (!publicKey || !provider) {
    return (
      <Button disabled colorScheme="blue">
        Connect wallet to create profile
      </Button>
    );
  }

  return (
    <>
      <Button onClick={onOpen} colorScheme="blue">
        New profile
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>New profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              isLoading={isPending}
              type="submit"
              colorScheme="blue"
              loadingText="Creating"
              ml={3}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}